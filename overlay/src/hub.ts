import { getName } from '../../shared/meta.ts';
import { $soul } from '../../shared/symbols.ts';
import { type DeviceEventSink, type DeviceWatch, watchDevice } from './deviceEvents.ts';
import { estimateEventBytes } from './eventSize.ts';
import type {
  InstrumentationHolder,
  InstrumentationSink,
  PipelineCreationInfo,
  TgpuBindGroupCreated,
  TgpuBindGroupEntryInfo,
  TgpuBindGroupInfo,
  TgpuInstrumentationEvent,
  TgpuInstrumentationEventInit,
  TgpuInstrumentationOptions,
  TgpuInstrumentationSnapshot,
  TgpuPipelineInfo,
  TgpuPipelineTrigger,
  TgpuResourceInfo,
} from './types.ts';

const DEFAULT_HISTORY_SIZE = 256;
const MAX_HISTORY_SIZE = 1_000_000;
const DEFAULT_HISTORY_MAX_BYTES = 4 * 1024 * 1024;
/** Events a single delivery pass may chain through re-entrant listeners before the storm is cut off. */
const MAX_EVENTS_PER_DELIVERY = 10_000;
/** Distinct subscriber failures surfaced per hub; later ones are only counted. */
const MAX_SURFACED_LISTENER_ERRORS = 5;

const UNAVAILABLE = [
  'gpuExecutionTime',
  'gpuMemoryUsage',
  'wrappedResources',
  'internalResources',
  'rawWebGPUCalls',
  'workgroupCounts',
  'perDispatchBindings',
  'textureMemory',
] as const;

type ResourceRec = {
  readonly kind: 'buffer' | 'texture';
  readonly id: number;
  readonly ref: WeakRef<object>;
  readonly sizeBytes: number | null;
  readonly usage: number;
  writes: number | null;
  bytesWritten: number | null;
};

type BindGroupRec = {
  readonly kind: 'bind-group';
  readonly id: number;
  readonly ref: WeakRef<object>;
  readonly layoutId: number;
  readonly origin: 'created' | 'adopted';
  readonly entries: readonly TgpuBindGroupEntryInfo[];
};

type PipelineRec = {
  readonly kind: 'pipeline';
  readonly id: number;
  readonly ref: WeakRef<object>;
  readonly pipeline: 'compute' | 'render';
  readonly trigger: TgpuPipelineTrigger;
  readonly resolveMs: number;
  readonly createMs: number;
  readonly wgsl: string | null;
  readonly wgslLength: number;
  readonly layoutIds: readonly number[];
  dispatches: number;
  draws: number;
};

/** Identity only: layouts and failed pipelines are referenced by events but never listed. */
type IdentityRec = { readonly kind: 'identity'; readonly id: number };

type Rec = ResourceRec | BindGroupRec | PipelineRec | IdentityRec;
type LiveRec = ResourceRec | BindGroupRec | PipelineRec;

type BindGroupLike = {
  readonly layout: { readonly entries: Readonly<Record<string, object | null>> };
  readonly entries: Readonly<Record<string, unknown>>;
};

/**
 * The per-root instrumentation state. Hook sites in TypeGPU call the sink methods (everything not part
 * of the public {@link TgpuInstrumentation} interface); consumers only see the public interface.
 *
 * Holds no strong reference to the root, to any tracked object or to any GPU object other than the device.
 */
export class InstrumentationHub implements InstrumentationSink, DeviceEventSink {
  readonly #watch: DeviceWatch;
  readonly #holder: InstrumentationHolder;
  readonly #historySize: number;
  readonly #historyMaxBytes: number;
  readonly #captureSource: boolean;

  #active = false;
  #disposed = false;
  #listeners: readonly ((event: TgpuInstrumentationEvent) => void)[] = [];

  #seq = 0;
  #nextId = 1;
  // History: a queue with a moving head. Evicted slots are cleared so that evicted events can be collected.
  #events: (TgpuInstrumentationEvent | undefined)[] = [];
  #eventBytes: number[] = [];
  #head = 0;
  #historyBytes = 0;

  // Delivery: events emitted while a delivery is running (a listener called back into TypeGPU) wait their turn.
  #pending: TgpuInstrumentationEvent[] = [];
  #delivering = false;

  readonly #byObject = new WeakMap<object, Rec>();
  readonly #live = new Map<number, LiveRec>();
  readonly #finalizer = new FinalizationRegistry<number>((id) => this.#onCollected(id));

  #submits = 0;
  #collectedWithoutDestroy = 0;
  #droppedEvents = 0;
  #droppedBytes = 0;
  #listenerErrors = 0;
  #lastListenerError: string | null = null;
  #surfacedListenerErrors = new Set<string>();

  /**
   * @param holder Where hook sites read the hub from; the hub publishes (or clears) itself there.
   * See {@link TgpuInstrumentationProvider} for why it must be a plain object that does not lead back to the root.
   * @throws RangeError for an invalid option, at attach time (a developer error, never at run time).
   */
  constructor(
    device: GPUDevice,
    options: TgpuInstrumentationOptions,
    holder: InstrumentationHolder,
  ) {
    this.#holder = holder;
    this.#historySize = checkedOption(
      'historySize',
      options.historySize,
      DEFAULT_HISTORY_SIZE,
      MAX_HISTORY_SIZE,
    );
    this.#historyMaxBytes = checkedOption(
      'historyMaxBytes',
      options.historyMaxBytes,
      DEFAULT_HISTORY_MAX_BYTES,
      Number.MAX_SAFE_INTEGER,
    );
    this.#captureSource = options.captureSource ?? true;

    // One shared, weakly-referencing listener per device; see deviceEvents.ts.
    this.#watch = watchDevice(device, this);

    this.enable();
  }

  // --- public ---

  get enabled(): boolean {
    return this.#active;
  }

  enable(): void {
    if (this.#disposed) {
      return;
    }
    this.#active = true;
    this.#holder.instrumentation = this;
  }

  disable(): void {
    this.#active = false;
    this.#holder.instrumentation = undefined;
  }

  subscribe(listener: (event: TgpuInstrumentationEvent) => void): () => void {
    if (this.#disposed) {
      return () => {};
    }
    // Copy-on-write, so (un)subscribing from inside a listener cannot disturb the running delivery.
    this.#listeners = [...this.#listeners, listener];
    return () => {
      this.#listeners = this.#listeners.filter((l) => l !== listener);
    };
  }

  history(): readonly TgpuInstrumentationEvent[] {
    return this.#events.slice(this.#head) as TgpuInstrumentationEvent[];
  }

  getSnapshot(): TgpuInstrumentationSnapshot {
    const resources: TgpuResourceInfo[] = [];
    const bindGroups: TgpuBindGroupInfo[] = [];
    const pipelines: TgpuPipelineInfo[] = [];

    for (const rec of this.#live.values()) {
      const object = rec.ref.deref();
      if (object === undefined) {
        continue;
      }
      const label = getName(object) ?? null;

      if (rec.kind === 'buffer' || rec.kind === 'texture') {
        resources.push({
          id: rec.id,
          resource: rec.kind,
          label,
          sizeBytes: rec.sizeBytes,
          usage: rec.usage,
          writes: rec.writes,
          bytesWritten: rec.bytesWritten,
        });
      } else if (rec.kind === 'bind-group') {
        bindGroups.push({
          id: rec.id,
          label,
          layoutId: rec.layoutId,
          origin: rec.origin,
          entries: rec.entries,
        });
      } else if (rec.kind === 'pipeline') {
        pipelines.push({
          id: rec.id,
          pipeline: rec.pipeline,
          label,
          trigger: rec.trigger,
          resolveMs: rec.resolveMs,
          createMs: rec.createMs,
          wgsl: rec.wgsl,
          wgslLength: rec.wgslLength,
          layoutIds: rec.layoutIds,
          dispatches: rec.dispatches,
          draws: rec.draws,
        });
      }
    }

    return {
      v: 2,
      t: performance.now(),
      enabled: this.#active,
      resources,
      bindGroups,
      pipelines,
      counters: {
        submits: this.#submits,
        collectedWithoutDestroy: this.#collectedWithoutDestroy,
        droppedEvents: this.#droppedEvents,
        droppedBytes: this.#droppedBytes,
        historyBytes: this.#historyBytes,
        listenerErrors: this.#listenerErrors,
        lastListenerError: this.#lastListenerError,
      },
      unavailable: UNAVAILABLE,
    };
  }

  dispose(): void {
    this.#active = false;
    this.#disposed = true;
    this.#holder.instrumentation = undefined;
    this.#listeners = [];
    this.#surfacedListenerErrors.clear();
    this.#watch.stopAll();
  }

  // --- internal: called by hook sites and by deviceEvents.ts ---

  handleDeviceError(event: Event): void {
    if (!this.#active) {
      return;
    }
    const error = (event as Partial<GPUUncapturedErrorEvent>).error;
    this.#emit({
      type: 'device-error',
      errorType: error?.constructor?.name ?? 'unknown',
      message: String(error?.message ?? ''),
    });
  }

  handleDeviceLost(info: GPUDeviceLostInfo): void {
    if (this.#active) {
      this.#emit({ type: 'device-lost', reason: String(info.reason), message: info.message });
    }
  }

  now(): number {
    return performance.now();
  }

  bufferMaterialized(buffer: object, descriptor: GPUBufferDescriptor): void {
    const rec: ResourceRec = {
      kind: 'buffer',
      id: this.#nextId++,
      ref: new WeakRef(buffer),
      sizeBytes: descriptor.size,
      usage: descriptor.usage,
      writes: 0,
      bytesWritten: 0,
    };
    this.#register(buffer, rec);
    this.#emit({
      type: 'resource-materialized',
      resource: 'buffer',
      id: rec.id,
      label: getName(buffer) ?? null,
      sizeBytes: descriptor.size,
      usage: descriptor.usage,
    });
  }

  textureMaterialized(texture: object, descriptor: GPUTextureDescriptor): void {
    const rec: ResourceRec = {
      kind: 'texture',
      id: this.#nextId++,
      ref: new WeakRef(texture),
      sizeBytes: null,
      usage: descriptor.usage,
      writes: null,
      bytesWritten: null,
    };
    this.#register(texture, rec);
    const size = descriptor.size;
    this.#emit({
      type: 'resource-materialized',
      resource: 'texture',
      id: rec.id,
      label: getName(texture) ?? null,
      format: descriptor.format,
      size: Array.isArray(size)
        ? [...size]
        : [size.width, size.height ?? 1, size.depthOrArrayLayers ?? 1],
      mipLevelCount: descriptor.mipLevelCount ?? 1,
      sampleCount: descriptor.sampleCount ?? 1,
      dimension: descriptor.dimension ?? '2d',
      usage: descriptor.usage,
    });
  }

  bufferWritten(buffer: object, bytes: number): void {
    const rec = this.#byObject.get(buffer);
    if (rec?.kind === 'buffer') {
      rec.writes = (rec.writes ?? 0) + 1;
      rec.bytesWritten = (rec.bytesWritten ?? 0) + bytes;
    }
  }

  /** Ignores objects that were never tracked (wrapped, or created while disabled). */
  resourceDestroyed(resource: object): void {
    const rec = this.#byObject.get(resource);
    if (rec?.kind !== 'buffer' && rec?.kind !== 'texture') {
      return;
    }
    this.#live.delete(rec.id);
    this.#byObject.delete(resource);
    this.#emit({
      type: 'resource-destroyed',
      resource: rec.kind,
      id: rec.id,
      label: getName(resource) ?? null,
    });
  }

  bindGroupCreated(bindGroupObject: object, origin: 'created' | 'adopted'): void {
    // `TgpuBindGroup` does not declare `entries`, but every implementation has it.
    const bindGroup = bindGroupObject as BindGroupLike;
    const entries: TgpuBindGroupEntryInfo[] = [];
    for (const [name, layoutEntry] of Object.entries(bindGroup.layout.entries)) {
      if (layoutEntry === null) {
        continue;
      }
      const value = bindGroup.entries[name];
      let kind: TgpuBindGroupEntryInfo['kind'] = 'other';
      let target: unknown;
      if ('uniform' in layoutEntry || 'storage' in layoutEntry) {
        kind = 'buffer';
        target = bufferOf(value);
      } else if (
        'texture' in layoutEntry ||
        'storageTexture' in layoutEntry ||
        'externalTexture' in layoutEntry
      ) {
        kind = 'texture';
        target = (value as { [$soul]?: { texture?: unknown } } | undefined)?.[$soul]?.texture;
      } else if ('sampler' in layoutEntry) {
        kind = 'sampler';
      }
      entries.push({ name, kind, resourceId: this.#trackedId(target) });
    }

    const layoutId = this.#identityId(bindGroup.layout);
    const rec: BindGroupRec = {
      kind: 'bind-group',
      id: this.#nextId++,
      ref: new WeakRef(bindGroupObject),
      layoutId,
      origin,
      entries,
    };
    this.#register(bindGroupObject, rec);
    this.#emit({
      type: 'bind-group-created',
      id: rec.id,
      label: getName(bindGroup.layout) ?? null,
      layoutId,
      origin,
      entries,
    } satisfies Omit<TgpuBindGroupCreated, 'v' | 'seq' | 't'>);
  }

  pipelineCreated(core: object, info: PipelineCreationInfo): void {
    // The async path can report after `disable()`.
    if (!this.#active) {
      return;
    }
    const layoutIds = info.layouts.map((layout) => this.#identityId(layout));
    const wgsl = this.#captureSource ? info.wgsl : null;
    const rec: PipelineRec = {
      kind: 'pipeline',
      id: this.#nextId++,
      ref: new WeakRef(core),
      pipeline: info.pipeline,
      trigger: info.trigger,
      resolveMs: info.resolveMs,
      createMs: info.createMs,
      wgsl,
      wgslLength: info.wgsl.length,
      layoutIds,
      dispatches: 0,
      draws: 0,
    };
    this.#register(core, rec);
    this.#emit({
      type: 'pipeline-created',
      id: rec.id,
      pipeline: info.pipeline,
      label: getName(core) ?? null,
      trigger: info.trigger,
      validation: info.trigger === 'initAsync' ? 'passed' : 'deferred',
      resolveMs: info.resolveMs,
      createMs: info.createMs,
      wgsl,
      wgslLength: info.wgsl.length,
      layoutIds,
      layoutLabels: info.layouts.map((layout) => getName(layout) ?? null),
    });

    this.#requestDiagnostics(rec.id, info.module);
  }

  /**
   * The async entry point rejects for an invalid pipeline, and then no pipeline exists to list.
   * The generated WGSL and the compiler messages are what the developer needs most at that point.
   */
  pipelineCreationFailed(core: object, info: PipelineCreationInfo, error: unknown): void {
    if (!this.#active) {
      return;
    }
    const id = this.#identityId(core);
    this.#emit({
      type: 'pipeline-creation-failed',
      id,
      pipeline: info.pipeline,
      label: getName(core) ?? null,
      trigger: 'initAsync',
      resolveMs: info.resolveMs,
      createMs: info.createMs,
      wgsl: this.#captureSource ? info.wgsl : null,
      wgslLength: info.wgsl.length,
      layoutIds: info.layouts.map((layout) => this.#identityId(layout)),
      layoutLabels: info.layouts.map((layout) => getName(layout) ?? null),
      errorType: (error as Error | undefined)?.constructor?.name ?? 'unknown',
      message: String((error as Error | undefined)?.message ?? error),
    });
    this.#requestDiagnostics(id, info.module);
  }

  #requestDiagnostics(pipelineId: number, shaderModule: unknown): void {
    const module = shaderModule as Partial<GPUShaderModule> | undefined;
    if (typeof module?.getCompilationInfo !== 'function') {
      return;
    }
    module.getCompilationInfo().then(
      (compilation) => {
        if (!this.#active) {
          return;
        }
        this.#emit({
          type: 'shader-diagnostics',
          pipelineId,
          messages: compilation.messages.map((m) => ({
            type: m.type,
            message: m.message,
            lineNum: m.lineNum,
            linePos: m.linePos,
          })),
        });
      },
      () => {
        // A lost device can reject this; the loss itself is reported separately.
      },
    );
  }

  dispatched(core: object): void {
    // A pass keeps the hub it saw when it was created, so it can outlive `disable()`.
    if (!this.#active) {
      return;
    }
    const rec = this.#byObject.get(core);
    if (rec?.kind === 'pipeline') {
      rec.dispatches++;
    }
  }

  drew(core: object): void {
    if (!this.#active) {
      return;
    }
    const rec = this.#byObject.get(core);
    if (rec?.kind === 'pipeline') {
      rec.draws++;
    }
  }

  submitted(): void {
    this.#submits++;
  }

  /**
   * Reports leftover resources, then detaches. A device owned by the root is destroyed by the root,
   * so the `lost` notification (reason `destroyed`) is still delivered to current subscribers.
   */
  rootDestroyed(ownDevice: boolean): void {
    let liveBuffers = 0;
    let liveTextures = 0;
    for (const rec of this.#live.values()) {
      if (rec.ref.deref() === undefined) {
        continue;
      }
      if (rec.kind === 'buffer') {
        liveBuffers++;
      } else if (rec.kind === 'texture') {
        liveTextures++;
      }
    }
    if (this.#active) {
      this.#emit({ type: 'root-destroyed', ownDevice, liveBuffers, liveTextures });
    }

    if (ownDevice) {
      this.#watch.stopErrors();
    } else {
      this.dispose();
    }
  }

  // --- private ---

  #register(object: object, rec: LiveRec): void {
    this.#byObject.set(object, rec);
    this.#live.set(rec.id, rec);
    this.#finalizer.register(object, rec.id);
  }

  #identityId(layout: object): number {
    let rec = this.#byObject.get(layout);
    if (rec === undefined) {
      rec = { kind: 'identity', id: this.#nextId++ };
      this.#byObject.set(layout, rec);
    }
    return rec.id;
  }

  #trackedId(object: unknown): number | null {
    if (typeof object !== 'object' || object === null) {
      return null;
    }
    return this.#byObject.get(object)?.id ?? null;
  }

  #onCollected(id: number): void {
    const rec = this.#live.get(id);
    if (rec === undefined) {
      return;
    }
    this.#live.delete(id);
    if (rec.kind === 'buffer' || rec.kind === 'texture') {
      this.#collectedWithoutDestroy++;
    }
  }

  #emit(init: TgpuInstrumentationEventInit): void {
    const event = deepFreeze({
      v: 2,
      seq: ++this.#seq,
      t: performance.now(),
      ...init,
    } as TgpuInstrumentationEvent);

    this.#record(event);

    // Events caused by a listener (it called back into TypeGPU) are queued behind the current delivery, so
    // every listener sees the events in `seq` order and a listener is never re-entered.
    this.#pending.push(event);
    if (this.#delivering) {
      return;
    }
    this.#delivering = true;
    try {
      for (let i = 0; i < this.#pending.length; i++) {
        if (i >= MAX_EVENTS_PER_DELIVERY) {
          this.#noteListenerError(
            new Error(
              `a subscriber keeps causing new events (over ${MAX_EVENTS_PER_DELIVERY} in one delivery); delivery stopped`,
            ),
          );
          break;
        }
        const queued = this.#pending[i] as TgpuInstrumentationEvent;
        for (const listener of this.#listeners) {
          try {
            listener(queued);
          } catch (error) {
            this.#noteListenerError(error);
          }
        }
      }
    } finally {
      this.#pending = [];
      this.#delivering = false;
    }
  }

  #record(event: TgpuInstrumentationEvent): void {
    const bytes = estimateEventBytes(event);
    if (this.#historySize === 0) {
      this.#droppedEvents++;
      this.#droppedBytes += bytes;
      return;
    }
    this.#events.push(event);
    this.#eventBytes.push(bytes);
    this.#historyBytes += bytes;
    // The newest event is always kept, even when it alone exceeds the byte bound.
    while (
      this.#events.length - this.#head > this.#historySize ||
      (this.#historyBytes > this.#historyMaxBytes && this.#events.length - this.#head > 1)
    ) {
      this.#evictOldest();
    }
  }

  #evictOldest(): void {
    const bytes = this.#eventBytes[this.#head] as number;
    this.#events[this.#head] = undefined;
    this.#head++;
    this.#historyBytes -= bytes;
    this.#droppedEvents++;
    this.#droppedBytes += bytes;
    // Compact once the dead prefix dominates, so the arrays do not grow with the number of events ever emitted.
    if (this.#head >= 1024 && this.#head * 2 >= this.#events.length) {
      this.#events = this.#events.slice(this.#head);
      this.#eventBytes = this.#eventBytes.slice(this.#head);
      this.#head = 0;
    }
  }

  /**
   * A subscriber failure must not reach the instrumented application and must not be silent: it is counted,
   * and the first few distinct ones are surfaced to the environment's error reporting.
   */
  #noteListenerError(error: unknown): void {
    this.#listenerErrors++;
    const text = describeError(error);
    this.#lastListenerError = text;
    if (
      this.#surfacedListenerErrors.size >= MAX_SURFACED_LISTENER_ERRORS ||
      this.#surfacedListenerErrors.has(text)
    ) {
      return;
    }
    this.#surfacedListenerErrors.add(text);
    surfaceError(error);
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

function surfaceError(error: unknown): void {
  try {
    if (typeof globalThis.reportError === 'function') {
      globalThis.reportError(error);
    } else {
      console.error('[typegpu instrumentation] a subscriber threw:', error);
    }
  } catch {
    // The environment's own error reporting failed; the failure stays counted in the snapshot.
  }
}

function checkedOption(
  name: string,
  value: number | undefined,
  fallback: number,
  max: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) {
    throw new RangeError(
      `unstable_instrumentation: ${name} must be an integer between 0 and ${max}, got ${String(value)}`,
    );
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) {
      deepFreeze(inner);
    }
  }
  return value;
}

/** A buffer entry is a buffer, or a binding that wraps one; touching `.buffer` of a TgpuBuffer would materialize it. */
function bufferOf(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  if ((value as { resourceType?: unknown }).resourceType === 'buffer') {
    return value;
  }
  const inner = (value as { buffer?: unknown }).buffer;
  return (inner as { resourceType?: unknown } | undefined)?.resourceType === 'buffer'
    ? inner
    : undefined;
}
