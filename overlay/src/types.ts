/**
 * Public, unstable data model of the instrumentation layer.
 *
 * Everything here is plain data: no TypeGPU objects, no GPU objects, no classes. Ids are integers
 * that are only meaningful within one root. Every value is either *observed* (passed to / returned
 * by WebGPU), *derived* (computed from observations), or absent: nothing in this model is an estimate.
 */

export type TgpuInstrumentationOptions = {
  /** Maximum number of events kept for late subscribers. `0` keeps none. @default 256 */
  historySize?: number | undefined;
  /**
   * Upper bound on the *estimated* payload size of the retained history, in bytes (see `estimateEventBytes`:
   * UTF-16 string length × 2 plus a fixed cost per field; it is not a heap measurement). The oldest events are
   * evicted until the history fits. The newest event is always kept, so the bound is
   * `max(historyMaxBytes, size of the newest event)`. @default 4 MiB
   */
  historyMaxBytes?: number | undefined;
  /**
   * Keep the generated WGSL text in pipeline events and snapshots. `false` keeps only its length
   * (`wgsl: null`), which removes the largest payloads. @default true
   */
  captureSource?: boolean | undefined;
};

type EventBase = {
  readonly v: 2;
  /**
   * Monotonic per root, starts at 1. History never has a gap between consecutive `seq` values (drops only truncate it).
   * A listener can miss the tail of a delivery pass when the 10 000-event storm cutoff trips; history still has those events.
   */
  readonly seq: number;
  /**
   * `performance.now()` at emission. CPU clock, milliseconds, with the browser's timer granularity
   * (0.1 ms in a normal Chrome page, observed on a real run) and the same quantisation in `resolveMs`/`createMs`.
   */
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

/**
 * TypeGPU generated WGSL and asked WebGPU to create a pipeline from it. This reports an **attempt that
 * returned**, not a successful compilation:
 * - `validation: 'deferred'` (synchronous creation, triggers `lazy` and `initSync`): WebGPU does not report
 *   whether the pipeline is valid. An invalid pipeline still produces this event, followed by a
 *   `shader-diagnostics` event with errors and, depending on the browser, zero to two `device-error` events (Chrome: two;
 *   Safari: one for a compute pipeline, none for a render pipeline). Their order relative to the others is not fixed.
 * - `validation: 'passed'` (`initAsync`): the creation promise resolved, so the pipeline is valid.
 *   A rejected promise produces `pipeline-creation-failed` instead.
 * Emitted synchronously inside the creating call (sync) or when the promise settles (async).
 */
export type TgpuPipelineCreated = EventBase & {
  readonly type: 'pipeline-created';
  /** Identity of the pipeline *core*; every `pipeline.with(...)` handle shares it. */
  readonly id: number;
  readonly pipeline: 'compute' | 'render';
  readonly label: string | null;
  /**
   * Derived from the entry point: `lazy` = compiled synchronously by the first dispatch/draw (or other
   * implicit use), `initSync`/`initAsync` = compiled by an explicit call.
   */
  readonly trigger: TgpuPipelineTrigger;
  readonly validation: 'deferred' | 'passed';
  /** CPU time spent in TypeGPU's WGSL generation. */
  readonly resolveMs: number;
  /**
   * CPU time from after the shader module was created to the end of the creation call (sync; the pipeline-layout
   * construction in its arguments is inside), or wall time until the `...Async` promise settled. It is neither GPU time
   * nor pure shader-compilation time, and `createShaderModule` itself is in neither `resolveMs` nor `createMs`.
   */
  readonly createMs: number;
  /** Observed: the exact source given to `device.createShaderModule`; `null` when `captureSource` is off. */
  readonly wgsl: string | null;
  /** Length of the source in UTF-16 code units, always present. */
  readonly wgslLength: number;
  readonly layoutIds: readonly number[];
  readonly layoutLabels: readonly (string | null)[];
};

/**
 * Creating the pipeline failed, so no pipeline exists afterwards.
 * - `phase: 'resolve'`: something threw before the pipeline-creation call: WGSL generation (a TGSL/resolution error), but also
 *   immediate-size validation, vertex/target connection and `createShaderModule`, because the hook wraps the whole
 *   `resolveAndCreateShaderModule` step. Any trigger. `wgsl` is `null` even when the code had been generated.
 * - `phase: 'create'`: WebGPU rejected the async creation (`trigger: 'initAsync'`); the WGSL and, through
 *   `shader-diagnostics`, the compiler messages are what is left to debug with. A *synchronous* creation never
 *   rejects: its validation failures arrive as `device-error` and `shader-diagnostics` after `pipeline-created`.
 * The error itself is rethrown to the application unchanged.
 */
export type TgpuPipelineCreationFailed = EventBase & {
  readonly type: 'pipeline-creation-failed';
  /** Identity of the pipeline core: the same id as a later successful `pipeline-created` of the same pipeline. Never listed in snapshots. */
  readonly id: number;
  readonly pipeline: 'compute' | 'render';
  readonly label: string | null;
  readonly trigger: TgpuPipelineTrigger;
  readonly phase: 'resolve' | 'create';
  /** `0` when the failure happened while generating the WGSL. */
  readonly resolveMs: number;
  /** Wall time until the creation promise rejected; `0` for a resolve failure. */
  readonly createMs: number;
  /** Observed: the exact source given to `device.createShaderModule`; `null` for a resolve failure or when `captureSource` is off. */
  readonly wgsl: string | null;
  readonly wgslLength: number;
  readonly layoutIds: readonly number[];
  readonly layoutLabels: readonly (string | null)[];
  /** Constructor name of the error (`GPUPipelineError`, `ResolutionError`, ...). */
  readonly errorType: string;
  readonly message: string;
};

export type TgpuShaderDiagnosticMessage = {
  readonly type: string;
  readonly message: string;
  /** Position in the generated WGSL (see `pipeline-created.wgsl`), not in the TypeScript source. */
  readonly lineNum: number;
  readonly linePos: number;
};

export type TgpuShaderDiagnostics = EventBase & {
  readonly type: 'shader-diagnostics';
  /** Id of the `pipeline-created` or `pipeline-creation-failed` event this belongs to. */
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
  | TgpuPipelineCreated
  | TgpuPipelineCreationFailed
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
  readonly wgsl: string | null;
  readonly wgslLength: number;
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
  /** Events evicted from the history (by count or by bytes). */
  readonly droppedEvents: number;
  /** Estimated payload bytes of the events evicted from the history. */
  readonly droppedBytes: number;
  /** Estimated payload bytes currently retained by the history. */
  readonly historyBytes: number;
  /**
   * Failures of the instrumentation layer itself (a bug in it, or an unexpected object). The first one disables
   * the layer, so the application keeps running unobserved instead of being disturbed; see `lastInternalError`.
   */
  readonly internalErrors: number;
  readonly lastInternalError: string | null;
  /**
   * Exceptions thrown by subscribers. They never reach the instrumented application; each is counted here and
   * the first few distinct ones are surfaced through `reportError` (or `console.error`).
   */
  readonly listenerErrors: number;
  /** `name: message` of the most recent subscriber exception, `null` if none. */
  readonly lastListenerError: string | null;
};

export type TgpuInstrumentationSnapshot = {
  readonly v: 2;
  readonly t: number;
  readonly enabled: boolean;
  readonly resources: readonly TgpuResourceInfo[];
  readonly bindGroups: readonly TgpuBindGroupInfo[];
  readonly pipelines: readonly TgpuPipelineInfo[];
  readonly counters: TgpuInstrumentationCounters;
  /**
   * The most recent `pipeline-creation-failed` events (at most 16) and the `device-lost` event, pinned outside the
   * history ring, so a late subscriber still learns why a pipeline is missing after thousands of later events.
   * Bounded in bytes by the history limit (oldest dropped first); WGSL follows `captureSource`.
   */
  readonly retainedFailures: readonly (TgpuPipelineCreationFailed | TgpuDeviceLost)[];
  /** What this layer cannot provide, so consumers never have to guess. */
  readonly unavailable: readonly string[];
};

export interface TgpuInstrumentation {
  readonly enabled: boolean;
  /** Resumes recording. No-op after `dispose()`. */
  enable(): void;
  /** Stops recording. Resources created meanwhile stay untracked. */
  disable(): void;
  /**
   * Listeners run synchronously in `seq` order. A listener may call back into TypeGPU: the events that causes are queued
   * behind the current delivery, never delivered re-entrantly. Returns the unsubscribe function.
   */
  subscribe(listener: (event: TgpuInstrumentationEvent) => void): () => void;
  /** At most `historySize` most recent events, oldest first. */
  history(): readonly TgpuInstrumentationEvent[];
  /** Plain, `structuredClone`-able description of what is currently alive. */
  getSnapshot(): TgpuInstrumentationSnapshot;
  /** Permanent: drops subscribers and device listeners. History and snapshots stay readable. */
  dispose(): void;
}

// ----------
// Provider and sink: the contract between TypeGPU's hook sites and an implementation
// ----------

/** Where hook sites read the active sink from. A plain object owned by the root; the sink publishes itself into it. */
export type InstrumentationHolder = { instrumentation: InstrumentationSink | undefined };

export type PipelineCreationInfo = {
  readonly pipeline: 'compute' | 'render';
  readonly trigger: TgpuPipelineTrigger;
  readonly resolveMs: number;
  readonly createMs: number;
  readonly wgsl: string;
  /** The `TgpuBindGroupLayout`s the pipeline uses, in group-index order. */
  readonly layouts: readonly object[];
  readonly module: unknown;
};

/**
 * What TypeGPU's hook sites call. The roots read it from `root[$internal].instrumentation`, which is
 * `undefined` unless instrumentation is enabled, so a disabled root pays one property read and one branch.
 * Not public API: use {@link TgpuInstrumentation}.
 */
export interface InstrumentationSink {
  /** What `root['~unstable'].instrumentation` returns: only the public methods, so consumers cannot forge hook calls. */
  readonly api: TgpuInstrumentation;
  now(): number;
  bufferMaterialized(buffer: object, descriptor: GPUBufferDescriptor): void;
  textureMaterialized(texture: object, descriptor: GPUTextureDescriptor): void;
  bufferWritten(buffer: object, bytes: number): void;
  resourceDestroyed(resource: object): void;
  bindGroupCreated(bindGroup: object, origin: 'created' | 'adopted'): void;
  pipelineCreated(core: object, info: PipelineCreationInfo): void;
  pipelineCreationFailed(core: object, info: PipelineCreationInfo, error: unknown): void;
  pipelineResolutionFailed(
    core: object,
    pipeline: 'compute' | 'render',
    trigger: TgpuPipelineTrigger,
    error: unknown,
  ): void;
  dispatched(core: object): void;
  drew(core: object): void;
  submitted(): void;
  rootDestroyed(ownDevice: boolean): void;
}

/**
 * What `unstable_instrumentation` accepts: a factory the root calls exactly once from its constructor.
 * It lives behind a type-only import in TypeGPU's core, so the implementation (`typegpu/unstable-instrumentation`)
 * is bundled only into applications that import it.
 */
export interface TgpuInstrumentationProvider {
  /**
   * `holder` must stay unreachable from the root's closures, and the returned sink must not retain the
   * root: V8 shares one scope object between all closures of a scope, so a callback created inside the root
   * constructor would keep the root alive through anything the device keeps alive.
   */
  attach(device: GPUDevice, holder: InstrumentationHolder): InstrumentationSink;
}
