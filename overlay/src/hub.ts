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
  TgpuDeviceLost,
  TgpuInstrumentation,
  TgpuInstrumentationEvent,
  TgpuInstrumentationEventInit,
  TgpuInstrumentationOptions,
  TgpuInstrumentationSnapshot,
  TgpuPipelineCreationFailed,
  TgpuPipelineInfo,
  TgpuPipelineTrigger,
  TgpuResourceInfo,
} from './types.ts';

const DEFAULT_HISTORY_SIZE = 256;
const MAX_HISTORY_SIZE = 1_000_000;
const DEFAULT_HISTORY_MAX_BYTES = 4 * 1024 * 1024;
/** Events a single delivery pass may chain through re-entrant listeners before the storm is cut off. */
const MAX_EVENTS_PER_DELIVERY = 10_000;
/** Distinct failures surfaced per hub; later ones are only counted. */
const MAX_SURFACED_ERRORS = 5;
const MAX_RETAINED_PIPELINE_FAILURES = 16;
const MIN_SWEEP_SIZE = 1024;

/** Frozen: every snapshot and every root shares it. */
const UNAVAILABLE: readonly string[] = Object.freeze([
  'gpuExecutionTime',
  'gpuMemoryUsage',
  'wrappedResources',
  'internalResources',
  'rawWebGPUCalls',
  'workgroupCounts',
  'perDispatchBindings',
  'textureMemory',
  'helperSubmissions',
  'restoredPipelines',
  'samplers',
  'textureViews',
  'renderBundles',
  'bindGroupLayouts',
]);

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

type Listener = { readonly fn: (event: TgpuInstrumentationEvent) => void; active: boolean };

type BindGroupLike = {
  readonly layout: { readonly entries: Readonly<Record<string, object | null>> };
  readonly entries: Readonly<Record<string, unknown>>;
};

/**
 * The per-root instrumentation state. Hook sites in TypeGPU call the sink methods; consumers only get
 * {@link InstrumentationHub.api}, which exposes the public interface and nothing else.
 *
 * Holds no strong reference to the root, to any tracked object or to any GPU object other than the device.
 *
 * Failure policy: every sink method is guarded. An exception inside this layer is counted, surfaced once, and
 * switches the layer off for good (`internalErrors` in the snapshot); it never reaches the application.
 */
export class InstrumentationHub implements InstrumentationSink, DeviceEventSink {
  readonly api: TgpuInstrumentation;
  readonly #watch: DeviceWatch;
  readonly #holder: InstrumentationHolder;
  readonly #historySize: number;
  readonly #historyMaxBytes: number;
  readonly #captureSource: boolean;

  #active = false;
  #disposed = false;
  /** Set by `root.destroy()` of an owned device: only the device's `lost` notification may still be delivered. */
  #closing = false;
  /** The device was lost while the layer was disabled; announced by the next `enable()`. */
  #lostWhileDisabled: { reason: string; message: string } | undefined;
  #rootDestroyedSeen = false;
  #listeners: readonly Listener[] = [];

  #seq = 0;
  #nextId = 1;
  // History: a queue with a moving head. Evicted slots are cleared so that evicted events can be collected.
  #events: (TgpuInstrumentationEvent | undefined)[] = [];
  #eventBytes: number[] = [];
  #head = 0;
  #historyBytes = 0;
  // Pinned outside the ring: why a pipeline is missing, and that the device is gone.
  #failures: (TgpuPipelineCreationFailed | TgpuDeviceLost)[] = [];

  // Delivery: events emitted while a delivery is running (a listener called back into TypeGPU) wait their turn.
  #pending: TgpuInstrumentationEvent[] = [];
  #delivering = false;

  readonly #byObject = new WeakMap<object, Rec>();
  readonly #live = new Map<number, LiveRec>();
  /** `#live` is swept of collected objects whenever it reaches this size (and on every snapshot). */
  #sweepAt = MIN_SWEEP_SIZE;

  #submits = 0;
  #collectedWithoutDestroy = 0;
  #droppedEvents = 0;
  #droppedBytes = 0;
  #listenerErrors = 0;
  #lastListenerError: string | null = null;
  #internalErrors = 0;
  #lastInternalError: string | null = null;
  readonly #surfacedErrors = new Set<string>();

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
    const checked = validateOptions(options);
    this.#historySize = checked.historySize;
    this.#historyMaxBytes = checked.historyMaxBytes;
    this.#captureSource = checked.captureSource;
    this.api = createApi(this);

    // One shared, weakly-referencing listener per device; see deviceEvents.ts.
    this.#watch = watchDevice(device, this);

    this.enable();
  }

  // --- public (reached through `api`) ---

  get enabled(): boolean {
    return this.#active;
  }

  enable(): void {
    if (this.#disposed || this.#closing) {
      return;
    }
    this.#active = true;
    this.#holder.instrumentation = this;
    this.#announceLossWhileDisabled();
  }

  disable(): void {
    this.#active = false;
    this.#holder.instrumentation = undefined;
  }

  subscribe(listener: (event: TgpuInstrumentationEvent) => void): () => void {
    if (typeof listener !== 'function') {
      throw new TypeError('instrumentation.subscribe expects a function');
    }
    if (this.#disposed) {
      return () => {};
    }
    // Copy-on-write, so (un)subscribing from inside a listener cannot disturb the running delivery. Each
    // subscription is its own record: subscribing the same function twice gives two independent unsubscribers.
    const entry: Listener = { fn: listener, active: true };
    this.#listeners = [...this.#listeners, entry];
    return () => {
      entry.active = false;
      this.#listeners = this.#listeners.filter((l) => l !== entry);
    };
  }

  history(): readonly TgpuInstrumentationEvent[] {
    return this.#events.slice(this.#head) as TgpuInstrumentationEvent[];
  }

  getSnapshot(): TgpuInstrumentationSnapshot {
    this.#sweep();
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
        internalErrors: this.#internalErrors,
        lastInternalError: this.#lastInternalError,
      },
      retainedFailures: [...this.#failures],
      unavailable: UNAVAILABLE,
    };
  }

  dispose(): void {
    this.#active = false;
    this.#disposed = true;
    this.#holder.instrumentation = undefined;
    for (const listener of this.#listeners) {
      listener.active = false;
    }
    this.#listeners = [];
    this.#surfacedErrors.clear();
    this.#watch.stopAll();
  }

  // --- sink: called by hook sites and by deviceEvents.ts ---

  handleDeviceError(event: Event): void {
    if (!this.#active) {
      return;
    }
    try {
      const error = (event as Partial<GPUUncapturedErrorEvent>).error;
      this.#emit({
        type: 'device-error',
        errorType: error?.constructor?.name ?? 'unknown',
        message: String(error?.message ?? ''),
      });
    } catch (error) {
      this.#fail(error);
    }
  }

  handleDeviceLost(info: GPUDeviceLostInfo): void {
    if (!this.#active && !this.#closing) {
      // Silent while off, like everything else, but not forgotten: a consumer that enables the layer again must
      // not be left believing the device is healthy. `lost` resolves once, so one slot is enough.
      this.#lostWhileDisabled = { reason: String(info.reason), message: info.message };
      return;
    }
    try {
      this.#emit({ type: 'device-lost', reason: String(info.reason), message: info.message });
    } catch (error) {
      this.#fail(error);
    }
    if (this.#closing) {
      this.dispose();
    }
  }

  #announceLossWhileDisabled(): void {
    const lost = this.#lostWhileDisabled;
    if (lost === undefined) {
      return;
    }
    this.#lostWhileDisabled = undefined;
    try {
      // Its `t` is the time of the announcement, not of the loss: the layer was not looking then.
      this.#emit({ type: 'device-lost', reason: lost.reason, message: lost.message });
    } catch (error) {
      this.#fail(error);
    }
  }

  now(): number {
    return performance.now();
  }

  bufferMaterialized(buffer: object, descriptor: GPUBufferDescriptor): void {
    try {
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
    } catch (error) {
      this.#fail(error);
    }
  }

  textureMaterialized(texture: object, descriptor: GPUTextureDescriptor): void {
    try {
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
    } catch (error) {
      this.#fail(error);
    }
  }

  bufferWritten(buffer: object, bytes: number): void {
    try {
      const rec = this.#byObject.get(buffer);
      if (rec?.kind === 'buffer') {
        rec.writes = (rec.writes ?? 0) + 1;
        rec.bytesWritten = (rec.bytesWritten ?? 0) + bytes;
      }
    } catch (error) {
      this.#fail(error);
    }
  }

  /** Ignores objects that were never tracked (wrapped, or created while disabled). */
  resourceDestroyed(resource: object): void {
    try {
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
    } catch (error) {
      this.#fail(error);
    }
  }

  bindGroupCreated(bindGroupObject: object, origin: 'created' | 'adopted'): void {
    try {
      // `TgpuBindGroup` does not declare `entries`, but every implementation has it.
      const bindGroup = bindGroupObject as BindGroupLike;
      const entries: TgpuBindGroupEntryInfo[] = [];
      for (const [name, layoutEntry] of Object.entries(bindGroup.layout.entries)) {
        if (layoutEntry === null) {
          continue;
        }
        const value = bindGroup.entries[name];
        let kind: TgpuBindGroupEntryInfo['kind'] = 'other';
        let resourceId: number | null = null;
        if ('uniform' in layoutEntry || 'storage' in layoutEntry) {
          kind = 'buffer';
          resourceId = this.#trackedId(bufferOf(value));
        } else if (
          'texture' in layoutEntry ||
          'storageTexture' in layoutEntry ||
          'externalTexture' in layoutEntry
        ) {
          kind = 'texture';
          // A texture bound directly, or a view/handle that points at its texture.
          resourceId =
            this.#trackedId(value) ??
            this.#trackedId(
              (value as { [$soul]?: { texture?: unknown } } | undefined)?.[$soul]?.texture,
            );
        } else if ('sampler' in layoutEntry) {
          kind = 'sampler';
        }
        entries.push({ name, kind, resourceId });
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
    } catch (error) {
      this.#fail(error);
    }
  }

  pipelineCreated(core: object, info: PipelineCreationInfo): void {
    // The async path can report after `disable()`.
    if (!this.#active) {
      return;
    }
    try {
      const layoutIds = info.layouts.map((layout) => this.#identityId(layout));
      const wgsl = this.#captureSource ? info.wgsl : null;
      // A pipeline that failed before keeps its id when it later succeeds: ids name the core.
      const known = this.#byObject.get(core);
      const rec: PipelineRec = {
        kind: 'pipeline',
        id: known?.kind === 'identity' ? known.id : this.#nextId++,
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
    } catch (error) {
      this.#fail(error);
    }
  }

  /** The async creation rejected: no pipeline exists to list, but the WGSL and the compiler messages remain. */
  pipelineCreationFailed(core: object, info: PipelineCreationInfo, error: unknown): void {
    if (!this.#active) {
      return;
    }
    try {
      const id = this.#identityId(core);
      this.#emit({
        type: 'pipeline-creation-failed',
        id,
        pipeline: info.pipeline,
        label: getName(core) ?? null,
        trigger: info.trigger,
        phase: 'create',
        resolveMs: info.resolveMs,
        createMs: info.createMs,
        wgsl: this.#captureSource ? info.wgsl : null,
        wgslLength: info.wgsl.length,
        layoutIds: info.layouts.map((layout) => this.#identityId(layout)),
        layoutLabels: info.layouts.map((layout) => getName(layout) ?? null),
        ...describeThrown(error),
      });
      this.#requestDiagnostics(id, info.module);
    } catch (thrown) {
      this.#fail(thrown);
    }
  }

  /** TypeGPU could not generate the WGSL (the error is rethrown to the application unchanged). */
  pipelineResolutionFailed(
    core: object,
    pipeline: 'compute' | 'render',
    trigger: TgpuPipelineTrigger,
    error: unknown,
  ): void {
    if (!this.#active) {
      return;
    }
    try {
      this.#emit({
        type: 'pipeline-creation-failed',
        id: this.#identityId(core),
        pipeline,
        label: getName(core) ?? null,
        trigger,
        phase: 'resolve',
        resolveMs: 0,
        createMs: 0,
        wgsl: null,
        wgslLength: 0,
        layoutIds: [],
        layoutLabels: [],
        ...describeThrown(error),
      });
    } catch (thrown) {
      this.#fail(thrown);
    }
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
        try {
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
        } catch (error) {
          this.#fail(error);
        }
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
    try {
      const rec = this.#byObject.get(core);
      if (rec?.kind === 'pipeline') {
        rec.dispatches++;
      }
    } catch (error) {
      this.#fail(error);
    }
  }

  drew(core: object): void {
    if (!this.#active) {
      return;
    }
    try {
      const rec = this.#byObject.get(core);
      if (rec?.kind === 'pipeline') {
        rec.draws++;
      }
    } catch (error) {
      this.#fail(error);
    }
  }

  submitted(): void {
    this.#submits++;
  }

  /**
   * Reports leftover resources, then detaches. A device owned by the root is destroyed by the root, so the
   * `lost` notification (reason `destroyed`) is still delivered to current subscribers; after it the stream
   * ends. For a borrowed device nothing more will be observed, so the layer is disposed at once.
   */
  rootDestroyed(ownDevice: boolean): void {
    // A listener of `root-destroyed` may call `root.destroy()` again; the event is emitted once per root.
    if (this.#rootDestroyedSeen) {
      return;
    }
    this.#rootDestroyedSeen = true;
    try {
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
    } catch (error) {
      this.#fail(error);
    }

    if (ownDevice) {
      // The device is about to be destroyed with everything on it: nothing is "live" any more.
      this.#closing = true;
      this.#active = false;
      this.#holder.instrumentation = undefined;
      this.#live.clear();
      this.#watch.stopErrors();
    } else {
      this.dispose();
    }
  }

  // --- private ---

  #register(object: object, rec: LiveRec): void {
    this.#byObject.set(object, rec);
    this.#live.set(rec.id, rec);
    if (this.#live.size >= this.#sweepAt) {
      this.#sweep();
    }
  }

  /**
   * Forgets records whose object was garbage-collected, counting the resources among them. Deterministic
   * (no finalizer callbacks): it runs when the registry has doubled since the last sweep, so a long-running
   * application that never asks for a snapshot cannot grow it without bound, and in every `getSnapshot()`.
   */
  #sweep(): void {
    for (const [id, rec] of this.#live) {
      if (rec.ref.deref() === undefined) {
        this.#live.delete(id);
        if (rec.kind === 'buffer' || rec.kind === 'texture') {
          this.#collectedWithoutDestroy++;
        }
      }
    }
    this.#sweepAt = Math.max(MIN_SWEEP_SIZE, this.#live.size * 2);
  }

  #identityId(object: object): number {
    let rec = this.#byObject.get(object);
    if (rec === undefined) {
      rec = { kind: 'identity', id: this.#nextId++ };
      this.#byObject.set(object, rec);
    }
    return rec.id;
  }

  #trackedId(object: unknown): number | null {
    if (typeof object !== 'object' || object === null) {
      return null;
    }
    return this.#byObject.get(object)?.id ?? null;
  }

  #emit(init: TgpuInstrumentationEventInit): void {
    // `init` is a fresh literal owned by this call, so it becomes the event itself (no copy).
    const stamped = init as unknown as { v: number; seq: number; t: number };
    stamped.v = 2;
    stamped.seq = ++this.#seq;
    stamped.t = performance.now();
    const event = deepFreeze(init as TgpuInstrumentationEvent);

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
          // Unsubscribed (or disposed) while this event was in flight: not called.
          if (!listener.active) {
            continue;
          }
          try {
            listener.fn(queued);
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
    if (event.type === 'pipeline-creation-failed' || event.type === 'device-lost') {
      this.#retainFailure(event);
    }
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

  /** At most 16 pipeline failures and one device loss, within the history's byte bound (newest always kept). */
  #retainFailure(event: TgpuPipelineCreationFailed | TgpuDeviceLost): void {
    const kept =
      event.type === 'device-lost'
        ? this.#failures.filter((f) => f.type !== 'device-lost')
        : this.#failures;
    kept.push(event);
    let failureCount = kept.filter((f) => f.type === 'pipeline-creation-failed').length;
    let total = kept.reduce((sum, f) => sum + estimateEventBytes(f), 0);
    while (
      kept.length > 1 &&
      (failureCount > MAX_RETAINED_PIPELINE_FAILURES || total > this.#historyMaxBytes)
    ) {
      // the single device-lost event is small and is the one fact a re-subscribing consumer needs: never evict it
      const oldest = kept.findIndex((f) => f !== event && f.type !== 'device-lost');
      if (oldest < 0) {
        break;
      }
      const [removed] = kept.splice(oldest, 1);
      if (removed?.type === 'pipeline-creation-failed') {
        failureCount--;
      }
      total -= estimateEventBytes(removed);
    }
    this.#failures = kept;
  }

  /**
   * A subscriber failure must not reach the instrumented application and must not be silent: it is counted,
   * and the first few distinct ones are surfaced to the environment's error reporting.
   */
  #noteListenerError(error: unknown): void {
    this.#listenerErrors++;
    const text = describeError(error);
    this.#lastListenerError = text;
    this.#surfaceOnce(text, error);
  }

  /** An internal failure switches the layer off: observing must never be able to disturb the application. */
  #fail(error: unknown): void {
    this.#internalErrors++;
    const text = describeError(error);
    this.#lastInternalError = text;
    this.#surfaceOnce(`internal: ${text}`, error);
    this.dispose();
  }

  #surfaceOnce(key: string, error: unknown): void {
    if (this.#surfacedErrors.size >= MAX_SURFACED_ERRORS || this.#surfacedErrors.has(key)) {
      return;
    }
    this.#surfacedErrors.add(key);
    surfaceError(error);
  }
}

/** The public face: only the documented methods, frozen. Built outside the class so no closure sees the hub's internals. */
function createApi(hub: InstrumentationHub): TgpuInstrumentation {
  return Object.freeze({
    get enabled() {
      return hub.enabled;
    },
    enable: () => hub.enable(),
    disable: () => hub.disable(),
    subscribe: (listener: (event: TgpuInstrumentationEvent) => void) => hub.subscribe(listener),
    history: () => hub.history(),
    getSnapshot: () => hub.getSnapshot(),
    dispose: () => hub.dispose(),
  });
}

/** `String(value)` that cannot throw (null-prototype objects, throwing `toString`, revoked proxies). */
function safeString(value: unknown): string {
  try {
    return String(value);
  } catch {
    try {
      return Object.prototype.toString.call(value);
    } catch {
      return '[unprintable value]';
    }
  }
}

function describeThrown(error: unknown): { errorType: string; message: string } {
  try {
    return {
      errorType: (error as Error | undefined)?.constructor?.name ?? 'unknown',
      message: safeString((error as Error | undefined)?.message ?? error),
    };
  } catch {
    // a getter or proxy trap on the thrown value threw: the layer must not fail because of what the app threw
    return { errorType: 'unknown', message: safeString(error) };
  }
}

function describeError(error: unknown): string {
  try {
    if (error instanceof Error) {
      return `${error.name}: ${safeString(error.message)}`;
    }
  } catch {
    // revoked proxy or throwing getter: fall through to the generic text
  }
  return safeString(error);
}

function surfaceError(error: unknown): void {
  try {
    if (typeof globalThis.reportError === 'function') {
      globalThis.reportError(error);
    } else {
      console.error('[typegpu instrumentation]', error);
    }
  } catch {
    // The environment's own error reporting failed; the failure stays counted in the snapshot.
  }
}

/**
 * Validates and normalises the options. Called by `createInstrumentation()` (so a mistake fails before
 * `tgpu.init` has requested a device) and again when a hub is attached.
 */
export function validateOptions(options: unknown): {
  historySize: number;
  historyMaxBytes: number;
  captureSource: boolean;
} {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(
      `unstable_instrumentation: options must be an object or undefined, got ${options === null ? 'null' : typeof options}`,
    );
  }
  const { historySize, historyMaxBytes, captureSource } = options as TgpuInstrumentationOptions;
  if (captureSource !== undefined && typeof captureSource !== 'boolean') {
    throw new TypeError(
      `unstable_instrumentation: captureSource must be a boolean, got ${typeof captureSource}`,
    );
  }
  return {
    historySize: checkedOption('historySize', historySize, DEFAULT_HISTORY_SIZE, MAX_HISTORY_SIZE),
    historyMaxBytes: checkedOption(
      'historyMaxBytes',
      historyMaxBytes,
      DEFAULT_HISTORY_MAX_BYTES,
      Number.MAX_SAFE_INTEGER,
    ),
    captureSource: captureSource ?? true,
  };
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
    for (const key in value) {
      deepFreeze(value[key]);
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
