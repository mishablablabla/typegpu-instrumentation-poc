# Event contract

What each event means, when it is emitted, what a consumer may rely on, and what it may not. Schema version **2** (`v: 2` on every event and snapshot). Every promise below has a test (file in the last column of the ordering table); anything not listed is not promised. Types: `overlay/src/types.ts`.

## Vocabulary

- **Synchronous event**: emitted inside the TypeGPU call that causes it, before that call returns to the application (and before listeners of later events run).
- **Asynchronous event**: emitted when a browser promise or event settles; its position relative to other events is only constrained as stated.
- **Stable field**: part of the contract (listed below). Everything else in an event is unspecified.
- `t` is `performance.now()` (CPU clock, milliseconds, with the browser's granularity). `resolveMs` / `createMs` are CPU times. **No event carries GPU execution time.**

## Events

| Event | Means | Sync? | Emitted | Stable fields | Several per user action? |
|---|---|---|---|---|---|
| `resource-materialized` | TypeGPU created the GPU buffer/texture (they are created lazily, at first use) | sync | right after `createBuffer`/`createTexture` returned, **before** an initial value is written (a listener must not rely on contents) | `resource`, `id`, `label`, buffer: `sizeBytes`, `usage`; texture: `format`, `size`, `mipLevelCount`, `sampleCount`, `dimension`, `usage` | no; one per resource |
| `resource-destroyed` | `destroy()` was called on a tracked resource | sync | **after** the GPU object's `destroy()` returned; once per resource (second `destroy()` is silent); only for resources this root tracked | `resource`, `id`, `label` | no |
| `bind-group-created` | a `GPUBindGroup` now exists for this root | sync | after TypeGPU stored it in its per-root cache (so a listener may safely unwrap it again); once per (root, bind group) | `id`, `layoutId`, `origin` (`created`: TypeGPU created the GPU object; `adopted`: the group already held one), `entries[]` (`name`, `kind`, `resourceId` or `null` = not tracked) | no |
| `pipeline-created` | TypeGPU generated WGSL and asked WebGPU to create a pipeline **and the call returned**. It is *not* a statement that the shader compiled. | sync for `lazy`/`initSync`; async for `initAsync` (when the promise resolves) | see left | `id` (the pipeline core's identity), `pipeline`, `trigger` (`lazy`, `initSync`, `initAsync`), `validation` (`deferred`: validity unknown, will arrive as `shader-diagnostics`/`device-error`; `passed`: the async promise resolved, so valid), `wgsl` (nullable, see `captureSource`), `wgslLength`, `layoutIds` | one per pipeline core (all `with()` handles share it) |
| `pipeline-creation-failed` | no pipeline was produced | `phase: 'resolve'` sync (TypeGPU could not generate WGSL; any trigger); `phase: 'create'` async (the creation promise rejected, `initAsync` only) | see left | `id` (same id a later successful creation of the same core gets), `trigger`, `phase`, `errorType`, `message`, `wgsl` (null for resolve failures) | at most one per attempt; a sync WebGPU validation failure does **not** produce it |
| `shader-diagnostics` | `getCompilationInfo()` of the pipeline's shader module resolved | async | after the creation event it belongs to (`pipelineId`), possibly after unrelated later events | `pipelineId`, `messages[]` (`type`, `message`, `lineNum`, `linePos`; positions refer to the generated WGSL) | one per creation event |
| `device-error` | the browser fired `uncapturederror` on the device | async | at the browser's discretion; one *failure* may produce several (Chrome: an invalid sync pipeline gives two; Safari: one for compute, none for render) | `errorType`, `message` (multi-line in Chrome, first line is the summary) | yes, and **not deduplicated**: they are distinct browser reports |
| `device-lost` | the device's `lost` promise resolved | async | once per device; also delivered (asynchronously) to roots attached after the loss | `reason`, `message` | no |
| `root-destroyed` | `root.destroy()` was called | sync | before the device is destroyed (own device) | `ownDevice`, `liveBuffers`, `liveTextures` (tracked, materialized, not destroyed, not collected) | no |

### Snapshot

`getSnapshot()` is plain, `structuredClone`-able data, `v: 2`: live resources / bind groups / pipelines (what the application can still reach: unreachable objects disappear), per-pipeline `dispatches`/`draws` counters, `counters` (`submits`, `droppedEvents`, `droppedBytes`, `historyBytes`, `listenerErrors`, `internalErrors`, …), `retainedFailures` (see below) and `unavailable` (what this layer cannot provide).

## Ordering and delivery guarantees (each tested)

| Guarantee | Test |
|---|---|
| `seq` is contiguous per root while enabled, starts at 1; history keeps the newest events in `seq` order | `instrumentation.test.ts` (seq, bounded history), real: `viability` invariants |
| Every listener receives events in `seq` order, even when a listener calls back into TypeGPU (nested events are queued behind the current delivery; a listener is never re-entered) | `contract.test.ts`, `defects.test.ts` R2 |
| Delivery is at-most-once; a listener removed (or the layer disposed) while an event is in flight is not called for it | `defects.test.ts` R3, R4 |
| Subscribing the same function twice gives two independent subscriptions; a non-function throws `TypeError` at `subscribe` | R6, R7 |
| A subscriber that throws never reaches the application or other subscribers; it is counted (`listenerErrors`, `lastListenerError`) and the first distinct 5 are surfaced through `reportError` (`console.error` where absent) | `contract.test.ts` |
| A subscriber that keeps causing events is cut off after 10 000 chained events | `contract.test.ts` |
| An exception **inside the layer** never reaches the application: it is counted (`internalErrors`), surfaced once, and the layer switches itself off (history stays readable) | `defects.test.ts` R9, R10 |
| An application error (for example an invalid shader) is the identical error with and without instrumentation | `defects.test.ts` E2, `instrumentation.test.ts` (async rejection) |
| Events and their nested arrays are frozen; consumers cannot corrupt history or each other | `contract.test.ts` |
| The public object has only `enabled`, `enable`, `disable`, `subscribe`, `history`, `getSnapshot`, `dispose`; the hook methods are unreachable | `defects.test.ts` A6 |
| After `root.destroy()` of an owned device the stream ends with `device-lost`; nothing is reported afterwards | `defects.test.ts` D11 |
| History is bounded by count **and** by estimated bytes; the newest event is always kept | `contract.test.ts` |
| The most recent 16 `pipeline-creation-failed` events and the `device-lost` event are retained in `snapshot.retainedFailures`, outside the ring | `defects.test.ts` D12 |

## What is *not* promised

- Order between asynchronous events beyond: `shader-diagnostics` follows its creation event; a `device-error` for a failure may arrive before or after that pipeline's `shader-diagnostics` (observed both ways across browsers).
- Attribution of a `device-error` to a pipeline or resource (browsers give a message, not an object; labels in the message are not unique: identical WGSL returns the first module and its label).
- That `pipeline-created` with `validation: 'deferred'` means a *valid* pipeline.
- Any event for what the layer cannot see (listed in `snapshot.unavailable`): GPU time, wrapped resources, helper submissions (`buffer.read/clear/copyFrom`, texture utilities, query sets), restored/precompiled pipelines, samplers, texture views, bind group layouts, render bundles, raw WebGPU calls. Direct `bindGroup.unwrap(root)` bypasses the cache and is not observed.
- `disable()` is a blind spot, not a pause: objects first created or compiled while disabled stay untracked after `enable()` (no later event announces them); a pass opened while disabled keeps not counting; `seq` continues without gaps because nothing is emitted while disabled.
- `origin: 'adopted'` is the layer's observation that the group already held a GPU object when this root unwrapped it; a group that another root created and a snapshot cached is also reported `adopted`.
- Several roots on one device each report the same `device-error` (every root observes the device).

## Compatibility policy

`v` is the event-schema version, `version` in the JSONL header is the file-format version. While the option is `unstable_`, a breaking change bumps `v` and is listed in the changelog below; additive fields do not. Consumers must ignore unknown fields and unknown event types. A reader must reject a `v` it does not know rather than guess. Test: `exportConsumers.test.ts`.

| v | Change |
|---|---|
| 1 | Prototype (never released): `pipeline-compiled`, `pipeline-compile-failed`, boolean option |
| 2 | `pipeline-compiled` → `pipeline-created` (+`validation`, +`wgslLength`, nullable `wgsl`); `pipeline-compile-failed` → `pipeline-creation-failed` (+`phase`, any trigger); option is `createInstrumentation()` from `typegpu/unstable-instrumentation`; snapshot gains `retainedFailures`, `droppedBytes`, `historyBytes`, `internalErrors` |
