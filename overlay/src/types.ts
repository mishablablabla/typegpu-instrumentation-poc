/**
 * Public, unstable data model of the instrumentation layer.
 *
 * Everything here is plain data: no TypeGPU objects, no GPU objects, no classes. Ids are integers
 * that are only meaningful within one root. Every value is either *observed* (passed to / returned
 * by WebGPU), *derived* (computed from observations), or absent: nothing in this model is an estimate.
 */

export type TgpuInstrumentationOptions = {
  /** Maximum number of events kept for late subscribers. @default 256 */
  historySize?: number | undefined;
};

type EventBase = {
  readonly v: 1;
  /** Monotonic per root, starts at 1. A gap between consecutive `seq` values never happens; drops only truncate history. */
  readonly seq: number;
  /** `performance.now()` at emission. CPU clock, milliseconds. */
  readonly t: number;
};

export type TgpuBufferMaterialized = EventBase & {
  readonly type: 'resource-materialized';
  readonly resource: 'buffer';
  readonly id: number;
  readonly label: string | null;
  /** Observed: `size` passed to `device.createBuffer` (already padded to 4 bytes). */
  readonly sizeBytes: number;
  /** Observed: `usage` flags passed to `device.createBuffer`. */
  readonly usage: number;
};

export type TgpuTextureMaterialized = EventBase & {
  readonly type: 'resource-materialized';
  readonly resource: 'texture';
  readonly id: number;
  readonly label: string | null;
  readonly format: string;
  readonly size: readonly number[];
  readonly mipLevelCount: number;
  readonly sampleCount: number;
  readonly dimension: string;
  readonly usage: number;
};

export type TgpuResourceDestroyed = EventBase & {
  readonly type: 'resource-destroyed';
  readonly resource: 'buffer' | 'texture';
  readonly id: number;
  readonly label: string | null;
};

export type TgpuBindGroupEntryInfo = {
  readonly name: string;
  readonly kind: 'buffer' | 'texture' | 'sampler' | 'other';
  /** `null` means "not tracked by this root's instrumentation" (raw GPU object, or created while disabled), not "absent". */
  readonly resourceId: number | null;
};

export type TgpuBindGroupCreated = EventBase & {
  readonly type: 'bind-group-created';
  readonly id: number;
  readonly label: string | null;
  readonly layoutId: number;
  /** `adopted`: wraps a `GPUBindGroup` the user created; TypeGPU did not create a GPU object. */
  readonly origin: 'created' | 'adopted';
  readonly entries: readonly TgpuBindGroupEntryInfo[];
};

export type TgpuPipelineTrigger = 'lazy' | 'initSync' | 'initAsync';

export type TgpuPipelineCompiled = EventBase & {
  readonly type: 'pipeline-compiled';
  /** Identity of the pipeline *core*; every `pipeline.with(...)` handle shares it. */
  readonly id: number;
  readonly pipeline: 'compute' | 'render';
  readonly label: string | null;
  /**
   * Derived from the entry point: `lazy` = compiled synchronously by the first dispatch/draw (or other
   * implicit use), `initSync`/`initAsync` = compiled by an explicit call.
   */
  readonly trigger: TgpuPipelineTrigger;
  /** CPU time spent in TypeGPU's WGSL generation. */
  readonly resolveMs: number;
  /**
   * CPU time of `createComputePipeline`/`createRenderPipeline` (sync), or wall time until the
   * `...Async` promise settled. It is neither GPU time nor pure shader-compilation time.
   */
  readonly createMs: number;
  /** Observed: the exact source given to `device.createShaderModule`. */
  readonly wgsl: string;
  readonly layoutIds: readonly number[];
  readonly layoutLabels: readonly (string | null)[];
};

export type TgpuShaderDiagnosticMessage = {
  readonly type: string;
  readonly message: string;
  /** Position in the generated WGSL (see `pipeline-compiled.wgsl`), not in the TypeScript source. */
  readonly lineNum: number;
  readonly linePos: number;
};

export type TgpuShaderDiagnostics = EventBase & {
  readonly type: 'shader-diagnostics';
  readonly pipelineId: number;
  /** Empty means the compiler was asked and reported nothing. */
  readonly messages: readonly TgpuShaderDiagnosticMessage[];
};

export type TgpuDeviceError = EventBase & {
  readonly type: 'device-error';
  /** Constructor name of the `GPUError` (`GPUValidationError`, `GPUOutOfMemoryError`, ...). */
  readonly errorType: string;
  readonly message: string;
};

export type TgpuDeviceLost = EventBase & {
  readonly type: 'device-lost';
  readonly reason: string;
  readonly message: string;
};

export type TgpuRootDestroyed = EventBase & {
  readonly type: 'root-destroyed';
  readonly ownDevice: boolean;
  /** Derived: tracked, materialized, not destroyed and not yet garbage-collected at this moment. */
  readonly liveBuffers: number;
  readonly liveTextures: number;
};

export type TgpuInstrumentationEvent =
  | TgpuBufferMaterialized
  | TgpuTextureMaterialized
  | TgpuResourceDestroyed
  | TgpuBindGroupCreated
  | TgpuPipelineCompiled
  | TgpuShaderDiagnostics
  | TgpuDeviceError
  | TgpuDeviceLost
  | TgpuRootDestroyed;

// Distributes over the union so each event kind keeps its own payload type.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type TgpuInstrumentationEventInit = DistributiveOmit<
  TgpuInstrumentationEvent,
  'v' | 'seq' | 't'
>;

export type TgpuResourceInfo = {
  readonly id: number;
  readonly resource: 'buffer' | 'texture';
  /** Derived: read from the object at snapshot time, so it reflects later `$name()` calls. */
  readonly label: string | null;
  /** Buffers only; `null` = not tracked for textures (no memory estimate is attempted). */
  readonly sizeBytes: number | null;
  readonly usage: number;
  /**
   * Buffers only (`null` for textures): writes made through TypeGPU (`buffer.write`/`patch`).
   * Direct `queue.writeBuffer` calls and writes into a still-mapped buffer are invisible.
   */
  readonly writes: number | null;
  readonly bytesWritten: number | null;
};

export type TgpuBindGroupInfo = {
  readonly id: number;
  readonly label: string | null;
  readonly layoutId: number;
  readonly origin: 'created' | 'adopted';
  readonly entries: readonly TgpuBindGroupEntryInfo[];
};

export type TgpuPipelineInfo = {
  readonly id: number;
  readonly pipeline: 'compute' | 'render';
  readonly label: string | null;
  readonly trigger: TgpuPipelineTrigger;
  readonly resolveMs: number;
  readonly createMs: number;
  readonly wgsl: string;
  readonly layoutIds: readonly number[];
  /** Calls to `dispatchWorkgroups*` made through TypeGPU on any handle of this pipeline. Not workgroups. */
  readonly dispatches: number;
  /** Calls to `draw*` made through TypeGPU on any handle of this pipeline. */
  readonly draws: number;
};

export type TgpuInstrumentationCounters = {
  /** `TgpuCommandEncoder.submit()` calls only. Helper-internal and user `queue.submit` calls are not counted. */
  readonly submits: number;
  /** Tracked resources that were garbage-collected without `destroy()`. Depends on GC timing: a hint, not a measurement. */
  readonly collectedWithoutDestroy: number;
  /** Events evicted from the history ring. */
  readonly droppedEvents: number;
  /** Exceptions thrown by subscribers (swallowed). */
  readonly listenerErrors: number;
};

export type TgpuInstrumentationSnapshot = {
  readonly v: 1;
  readonly t: number;
  readonly enabled: boolean;
  readonly resources: readonly TgpuResourceInfo[];
  readonly bindGroups: readonly TgpuBindGroupInfo[];
  readonly pipelines: readonly TgpuPipelineInfo[];
  readonly counters: TgpuInstrumentationCounters;
  /** What this layer cannot provide, so consumers never have to guess. */
  readonly unavailable: readonly string[];
};

export interface TgpuInstrumentation {
  readonly enabled: boolean;
  /** Resumes recording. No-op after `dispose()`. */
  enable(): void;
  /** Stops recording. Resources created meanwhile stay untracked. */
  disable(): void;
  /** Listeners run synchronously in `seq` order and must not call back into TypeGPU. Returns the unsubscribe function. */
  subscribe(listener: (event: TgpuInstrumentationEvent) => void): () => void;
  /** At most `historySize` most recent events, oldest first. */
  history(): readonly TgpuInstrumentationEvent[];
  /** Plain, `structuredClone`-able description of what is currently alive. */
  getSnapshot(): TgpuInstrumentationSnapshot;
  /** Permanent: drops subscribers and device listeners. History and snapshots stay readable. */
  dispose(): void;
}
