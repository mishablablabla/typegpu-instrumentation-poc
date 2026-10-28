# Event contract

What each event means, when it is emitted, what a consumer may rely on, and what it may not. Schema version **2** (`v: 2` on every event and snapshot). This is the one authoritative definition of the contract; the documentation page and the other reports link here. Promises in the ordering table name the test that pins them; anything not listed is not promised, and the known gaps between this text and the code are listed under [Known deviations](#known-deviations-found-by-audit). Types: `overlay/src/types.ts`.

## Vocabulary

- **Synchronous event**: emitted inside the TypeGPU call that causes it, before that call returns to the application (and before listeners of later events run).
- **Asynchronous event**: emitted when a browser promise or event settles; its position relative to other events is only constrained as stated.
- **Stable field**: part of the contract (listed below). Everything else in an event is unspecified.
- `t` is `performance.now()` (CPU clock, milliseconds, with the browser's granularity). `resolveMs` is the CPU time of TypeGPU's WGSL generation; `createMs` runs from after the shader module exists to the end of the creation call (sync; pipeline-layout construction in its arguments is inside) or to settlement of the `...Async` promise; `createShaderModule` itself is in neither. **No event carries GPU execution time.**

## Events

| Event | Means | Sync? | Emitted | Stable fields | Several per user action? |
|---|---|---|---|---|---|
| `resource-materialized` | TypeGPU created the GPU buffer/texture (they are created lazily, at first use) | sync | right after `createBuffer`/`createTexture` returned, **before** an initial value is written (a listener must not rely on contents) | `resource`, `id`, `label`, buffer: `sizeBytes`, `usage`; texture: `format`, `size`, `mipLevelCount`, `sampleCount`, `dimension`, `usage` | no; one per resource |
| `resource-destroyed` | `destroy()` was called on a tracked resource | sync | **after** the GPU object's `destroy()` returned; once per resource (second `destroy()` is silent); only for resources this root tracked | `resource`, `id`, `label` | no |
| `bind-group-created` | a `GPUBindGroup` now exists for this root | sync | after TypeGPU stored it in its per-root cache (so a listener may safely unwrap it again); once per (root, bind group) | `id`, `label` (the layout's name; the snapshot's `bindGroups[].label` is the group's own and usually `null`), `layoutId`, `origin` (`created`: TypeGPU created the GPU object; `adopted`: the group already held one), `entries[]` (`name`, `kind`, `resourceId` or `null` = not tracked) | no |
| `pipeline-created` | TypeGPU generated WGSL and asked WebGPU to create a pipeline **and the call returned**. It is *not* a statement that the shader compiled. | sync for `lazy`/`initSync`; async for `initAsync` (when the promise resolves) | see left | `id` (the pipeline core's identity), `pipeline` (`compute`/`render`), `label`, `trigger` (`lazy`, `initSync`, `initAsync`), `validation` (`deferred`: validity unknown, will arrive as `shader-diagnostics`/`device-error`; `passed`: the async promise resolved, so valid; derived from the trigger, not separately observed), `resolveMs`, `createMs` (CPU; see below), `wgsl` (nullable, see `captureSource`), `wgslLength`, `layoutIds`, `layoutLabels` | one per pipeline core (all `with()` handles share it) |
| `pipeline-creation-failed` | no pipeline was produced | `phase: 'resolve'` sync (something threw **before the pipeline-creation call**: WGSL generation, which is the usual case, but also immediate-size validation, vertex/target connection and `createShaderModule`, because the hook wraps that whole step; any trigger; `wgsl` is `null` even when code had been generated); `phase: 'create'` async (the creation promise rejected, `initAsync` only) | see left | `id` (same id a later successful creation of the same core gets), `pipeline`, `label`, `trigger`, `phase`, `errorType`, `message`, `wgsl` (null for resolve failures), `wgslLength`, `resolveMs`, `createMs`, `layoutIds`, `layoutLabels` | one per failed **call**: a loop that retries the same broken pipeline every frame emits one event per frame (see deviations); a sync WebGPU validation failure does **not** produce it |
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
| The public facade has only `enabled`, `enable`, `disable`, `subscribe`, `history`, `getSnapshot`, `dispose`; the hook methods are unreachable through it (the hub itself is reachable by code that imports TypeGPU's `$internal` symbol) | `defects.test.ts` A6 |
| After `root.destroy()` of an owned device the stream ends with `device-lost`; nothing is reported afterwards | `defects.test.ts` D11 |
| History is bounded by count **and** by estimated bytes; the newest event is always kept | `contract.test.ts` |
| The most recent 16 `pipeline-creation-failed` events and the `device-lost` event are retained in `snapshot.retainedFailures`, outside the ring; byte pressure evicts failures, never the `device-lost` event | `defects.test.ts` D12, `audit-fixes.test.ts` A-2 |
| A subscriber that throws a value that cannot be turned into text (null-prototype object, throwing getter or `toString`, revoked proxy) is isolated like any other; the layer stays on | `audit-fixes.test.ts` A-1, A-1b |
| `root-destroyed` is emitted once per root, even if a listener triggers the destroy hook again | `audit-fixes.test.ts` A-3 |
| Option mistakes throw (`RangeError` for numbers, `TypeError` for types) from `createInstrumentation()` itself, before `tgpu.init` requests a device; a device whose `lost` is not a promise does not break attaching | `audit-fixes.test.ts` A-4, A-4b, A-5 |

## What is *not* promised

- Order between asynchronous events beyond: `shader-diagnostics` follows its creation event; a `device-error` for a failure may arrive before or after that pipeline's `shader-diagnostics` (observed both ways across browsers).
- Attribution of a `device-error` to a pipeline or resource (browsers give a message, not an object; labels in the message are not unique: identical WGSL returns the first module and its label).
- That `pipeline-created` with `validation: 'deferred'` means a *valid* pipeline.
- Any event for what the layer cannot see (listed in `snapshot.unavailable`): GPU time, wrapped resources, helper submissions (`buffer.read/clear/copyFrom`, texture utilities, query sets), restored/precompiled pipelines, samplers, texture views, bind group layouts, render bundles, raw WebGPU calls. Direct `bindGroup.unwrap(root)` bypasses the cache and is not observed.
- `disable()` is a blind spot, not a pause: objects first created or compiled while disabled stay untracked after `enable()` (no later event announces them); a pass opened while disabled keeps not counting; `seq` continues without gaps because nothing is emitted while disabled.
- `origin: 'adopted'` is the layer's observation that the group already held a GPU object when this root unwrapped it; a group that another root created and a snapshot cached is also reported `adopted`.
- Several roots on one device each report the same `device-error` (every root observes the device).

## Known deviations found by audit

Verified by reading or running the code on 2026-10-28; none is a schema change. Items marked *fixed* have a regression test (above); the others are limits to know, not hidden.

| Item | Status |
|---|---|
| `phase: 'resolve'` covers more than WGSL generation (row above) | documented; the better fix (keep the generated code and time for the catch) needs a change inside the patched pipeline files |
| One `pipeline-creation-failed` per failed call: a render loop that unwraps a broken pipeline every frame fills the 256-event ring in about 4 s at 60 fps, evicting the events that explain the failure; `retainedFailures` keeps only 16 | **open**; mitigation: subscribe and stop, or rely on `retainedFailures`; a coalescing rule is a design decision, not made |
| `device-lost` is not recorded while the layer is `disable()`d, and `enable()` does not announce it afterwards (a consumer that re-enables believes the device is healthy); test `mutation-gaps.test.ts` M22 pins this | **open**, by design of `disable()` (a blind spot, not a pause) |
| A listener that trips the 10 000-event storm cutoff misses the rest of that delivery pass although history keeps those events (`seq` has no gap in history, may have one for that listener) | documented |
| Draws recorded into render-bundle encoders are counted when recorded, so a bundle executed N times counts once and a bundle never executed still counts; `renderBundles` is in `snapshot.unavailable` | **open**, documented |
| History is bounded by an *estimate* of payload bytes; pinned failures have their own budget of the same size and each live pipeline keeps its WGSL (unless `captureSource: false`), so retained memory can reach about twice `historyMaxBytes` plus the live WGSL | documented |
| The hub keeps the `GPUDevice` wrapper reachable while a consumer holds the facade after `dispose()` | suspected, not measured |
| A subscriber throwing an unprintable value used to switch the whole layer off | **fixed** (A-1) |
| `device-lost` could be evicted from `retainedFailures` by byte pressure | **fixed** (A-2) |
| A re-entrant destroy hook duplicated `root-destroyed` in history | **fixed** (A-3) |
| An invalid option threw inside the root constructor after an own device had been requested; `createInstrumentation(null)` threw a `TypeError` with an unrelated text; `captureSource` was not validated | **fixed** (A-4) |

## Compatibility policy

`v` is the event-schema version, `version` in the JSONL header is the file-format version. While the option is `unstable_`, a breaking change bumps `v` and is listed in the changelog below; additive fields do not. Consumers must ignore unknown fields and unknown event types. A reader must reject a `v` it does not know rather than guess. Test: `exportConsumers.test.ts`.

| v | Change |
|---|---|
| 1 | Prototype (never released): `pipeline-compiled`, `pipeline-compile-failed`, boolean option |
| 2 | `pipeline-compiled` → `pipeline-created` (+`validation`, +`wgslLength`, nullable `wgsl`); `pipeline-compile-failed` → `pipeline-creation-failed` (+`phase`, any trigger); option is `createInstrumentation()` from `typegpu/unstable-instrumentation`; snapshot gains `retainedFailures`, `droppedBytes`, `historyBytes`, `internalErrors`. 2026-10-28: behavioural fixes and clarifications only (see Known deviations), no field added or removed |
