import { getName } from '../../shared/meta.ts';
import { $soul } from '../../shared/symbols.ts';
import type {
  TgpuBindGroupCreated,
  TgpuBindGroupEntryInfo,
  TgpuBindGroupInfo,
  TgpuInstrumentation,
  TgpuInstrumentationEvent,
  TgpuInstrumentationEventInit,
  TgpuInstrumentationOptions,
  TgpuInstrumentationSnapshot,
  TgpuPipelineInfo,
  TgpuPipelineTrigger,
  TgpuResourceInfo,
} from './types.ts';

const DEFAULT_HISTORY_SIZE = 256;

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
  readonly wgsl: string;
  readonly layoutIds: readonly number[];
  dispatches: number;
  draws: number;
};

/** Identity only: layouts and failed pipelines are referenced by events but never listed. */
type IdentityRec = { readonly kind: 'identity'; readonly id: number };

type Rec = ResourceRec | BindGroupRec | PipelineRec | IdentityRec;
type LiveRec = ResourceRec | BindGroupRec | PipelineRec;

export type InstrumentationHolder = { instrumentation: InstrumentationHub | undefined };

export type PipelineCompiledInfo = {
  readonly pipeline: 'compute' | 'render';
  readonly trigger: TgpuPipelineTrigger;
  readonly resolveMs: number;
  readonly createMs: number;
  readonly wgsl: string;
  /** The `TgpuBindGroupLayout`s the pipeline uses, in group-index order. */
  readonly layouts: readonly object[];
  readonly module: unknown;
};

type BindGroupLike = {
  readonly layout: { readonly entries: Readonly<Record<string, object | null>> };
  readonly entries: Readonly<Record<string, unknown>>;
};

/**
 * The per-root instrumentation state. Hook sites in TypeGPU call the internal methods (everything
 * not part of {@link TgpuInstrumentation}); consumers only see the public interface.
 *
 * Holds no strong reference to the root, to any tracked object or to any GPU object other than the device.
 */
export class InstrumentationHub implements TgpuInstrumentation {
  readonly #device: GPUDevice;
  readonly #holder: InstrumentationHolder;

  #active = false;
  #disposed = false;
  #listeners: readonly ((event: TgpuInstrumentationEvent) => void)[] = [];

  #seq = 0;
  #nextId = 1;
  readonly #ring: (TgpuInstrumentationEvent | undefined)[];
  #ringStart = 0;
  #ringSize = 0;

  readonly #byObject = new WeakMap<object, Rec>();
  readonly #live = new Map<number, LiveRec>();
  readonly #finalizer = new FinalizationRegistry<number>((id) => this.#onCollected(id));

  #submits = 0;
  #collectedWithoutDestroy = 0;
  #droppedEvents = 0;
  #listenerErrors = 0;

  #errorListener: ((event: Event) => void) | undefined;

  /**
   * @param holder Where hook sites read the hub from; the hub publishes (or clears) itself there.
   * It must be a plain object that does not lead back to the root. A callback created inside the
   * root's constructor would not do: V8 shares one scope object between all closures of a scope, so
   * it would keep the root alive through the hub (which the device keeps alive).
   */
  constructor(
    device: GPUDevice,
    options: TgpuInstrumentationOptions,
    holder: InstrumentationHolder,
  ) {
    this.#device = device;
    this.#holder = holder;
    const historySize = Math.max(0, Math.floor(options.historySize ?? DEFAULT_HISTORY_SIZE));
    this.#ring = Array.from({ length: historySize }, () => undefined);

    if (typeof device.addEventListener === 'function') {
      this.#errorListener = (event) => {
        if (!this.#active) {
          return;
        }
        const error = (event as Partial<GPUUncapturedErrorEvent>).error;
        this.#emit({
          type: 'device-error',
          errorType: error?.constructor?.name ?? 'unknown',
          message: String(error?.message ?? ''),
        });
      };
      device.addEventListener('uncapturederror', this.#errorListener);
    }

    // `lost` never rejects. It cannot be unsubscribed from, hence the flag checks.
    void device.lost?.then((info) => {
      if (this.#active) {
        this.#emit({ type: 'device-lost', reason: String(info.reason), message: info.message });
      }
    });

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
    const result: TgpuInstrumentationEvent[] = [];
    for (let i = 0; i < this.#ringSize; i++) {
      result.push(
        this.#ring[(this.#ringStart + i) % this.#ring.length] as TgpuInstrumentationEvent,
      );
    }
    return result;
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
          layoutIds: rec.layoutIds,
          dispatches: rec.dispatches,
          draws: rec.draws,
        });
      }
    }

    return {
      v: 1,
      t: performance.now(),
      enabled: this.#active,
      resources,
      bindGroups,
      pipelines,
      counters: {
        submits: this.#submits,
        collectedWithoutDestroy: this.#collectedWithoutDestroy,
        droppedEvents: this.#droppedEvents,
        listenerErrors: this.#listenerErrors,
      },
      unavailable: UNAVAILABLE,
    };
  }

  dispose(): void {
    this.#active = false;
    this.#disposed = true;
    this.#holder.instrumentation = undefined;
    this.#listeners = [];
    this.#removeErrorListener();
  }

  // --- internal: called by hook sites ---

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

  pipelineCompiled(core: object, info: PipelineCompiledInfo): void {
    // The async path can report after `disable()`.
    if (!this.#active) {
      return;
    }
    const layoutIds = info.layouts.map((layout) => this.#identityId(layout));
    const rec: PipelineRec = {
      kind: 'pipeline',
      id: this.#nextId++,
      ref: new WeakRef(core),
      pipeline: info.pipeline,
      trigger: info.trigger,
      resolveMs: info.resolveMs,
      createMs: info.createMs,
      wgsl: info.wgsl,
      layoutIds,
      dispatches: 0,
      draws: 0,
    };
    this.#register(core, rec);
    this.#emit({
      type: 'pipeline-compiled',
      id: rec.id,
      pipeline: info.pipeline,
      label: getName(core) ?? null,
      trigger: info.trigger,
      resolveMs: info.resolveMs,
      createMs: info.createMs,
      wgsl: info.wgsl,
      layoutIds,
      layoutLabels: info.layouts.map((layout) => getName(layout) ?? null),
    });

    this.#requestDiagnostics(rec.id, info.module);
  }

  /**
   * The async entry point rejects for an invalid pipeline, and then no pipeline exists to list.
   * The generated WGSL and the compiler messages are what the developer needs most at that point.
   */
  pipelineFailed(core: object, info: PipelineCompiledInfo, error: unknown): void {
    if (!this.#active) {
      return;
    }
    const id = this.#identityId(core);
    this.#emit({
      type: 'pipeline-compile-failed',
      id,
      pipeline: info.pipeline,
      label: getName(core) ?? null,
      trigger: 'initAsync',
      resolveMs: info.resolveMs,
      createMs: info.createMs,
      wgsl: info.wgsl,
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
      this.#removeErrorListener();
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

  #removeErrorListener(): void {
    if (this.#errorListener !== undefined) {
      this.#device.removeEventListener('uncapturederror', this.#errorListener);
      this.#errorListener = undefined;
    }
  }

  #emit(init: TgpuInstrumentationEventInit): void {
    const event = {
      v: 1,
      seq: ++this.#seq,
      t: performance.now(),
      ...init,
    } as TgpuInstrumentationEvent;

    const capacity = this.#ring.length;
    if (capacity === 0) {
      this.#droppedEvents++;
    } else if (this.#ringSize < capacity) {
      this.#ring[(this.#ringStart + this.#ringSize) % capacity] = event;
      this.#ringSize++;
    } else {
      this.#ring[this.#ringStart] = event;
      this.#ringStart = (this.#ringStart + 1) % capacity;
      this.#droppedEvents++;
    }

    for (const listener of this.#listeners) {
      try {
        listener(event);
      } catch {
        this.#listenerErrors++;
      }
    }
  }
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
