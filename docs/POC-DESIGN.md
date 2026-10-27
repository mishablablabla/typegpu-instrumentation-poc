# POC design: opt-in instrumentation for TypeGPU

Baseline: upstream `software-mansion/TypeGPU` `7c853fa3` (`origin/main`), Node v24.21.0, pnpm 11.1.2, Vitest 4.1.11, Darwin arm64.
Source references below are `packages/typegpu/src/…:line` at that commit. Everything not marked *(verified)* is a design decision or a hypothesis.

## 1. Hypothesis and target use cases

**Hypothesis.** A small optional layer, hooked into TypeGPU's *existing* execution paths, can give consumers TypeGPU-specific diagnostics that raw-WebGPU tools cannot (names, lazy-compile context, generated WGSL, binding graph, lifecycle at the TypeGPU level), with bounded memory, zero cost to non-users, and no UI dependency in core.

Use cases chosen (each must be demonstrated by a test and a consumer; anything without one is cut):

| # | Question a developer asks | Data that answers it |
|---|---|---|
| U1 | "What WGSL did TypeGPU generate for this pipeline, and did the compiler complain?" | `pipeline-compiled` (WGSL) + `shader-diagnostics` |
| U2 | "Why does my first frame hitch?" | `pipeline-compiled.trigger === 'lazy'` (compiled on first dispatch/draw, synchronously) + CPU `resolveMs`/`createMs` |
| U3 | "Why is nothing drawn / what is bound?" | `device-error` with labels, `bind-group-created` (entry → resource ids, `null` when unknown), pipeline layouts |
| U4 | "Am I leaking GPU resources?" | live resource list, `resource-destroyed`, `root-destroyed.live*`, `collectedWithoutDestroy` |
| U5 | "How much work/churn per frame?" | per-pipeline dispatch/draw counters, `submits`, per-buffer write counters |

## 2. Verification of the research's assumptions

Checked against the pinned source; corrections to `DEVTOOLS-INSTRUMENTATION-RESEARCH.md`:

- *(verified)* Lines/symbols cited there are identical at `7c853fa3` (the two commits differ only in vertex-format I/O).
- *(verified)* No handlers for `uncapturederror`, `device.lost`, error scopes or `getCompilationInfo` exist in `src` (non-test grep: 0 hits). WGSL is not kept in `Memo` (`core/pipeline/computePipeline.ts:221`, `renderPipeline.ts:442`).
- *(verified)* Buffers/textures are created lazily inside `materialize` (`core/buffer/buffer.ts:269-276`, `core/texture/texture.ts:326-333`); wrapped `GPUBuffer`/`GPUTexture` skip the `createX` branch, so they are **never reported** (not ours to track).
- *(verified)* Pipeline handles share one `*PipelineCore`; compile happens in `initSync`/`initAsync`, and `unwrap()` calls `initSync()` (`computePipeline.ts:566`, `renderPipeline.ts:962`), so a first dispatch compiles synchronously.
- *(verified)* `ExperimentalTgpuRoot`/`TgpuRoot` already types `[$internal]` (`core/root/rootTypes.ts:503`), and resources hold their root (`buffer.ts:215`, `texture.ts` `$internal.root`), so a hook site can reach per-root state with one property read; `emitComputeDispatch`/`emitRenderDraw` receive `root` (`core/pipeline/drawState.ts:312,353`).
- *(verified)* Bind groups and layouts are created through root-level `WeakMemo`s (`core/root/init.ts:350-351`) → one place to observe creation; before `createBindGroup` runs, every referenced TypeGPU buffer is already materialized (`tgpuBindGroupLayout.ts:545-600`), so *materialize-before-bind-group* ordering is guaranteed.
- **Changed — no workgroup counts.** The dispatch hook sees only an opaque `emit` closure (`drawState.ts:353`), not `x,y,z`. Reporting them would need edits at every call site. Dropped: counters are *calls*, not workgroups.
- **Changed — no `declare` event.** Only `materialize` is a real GPU-object moment; constructor hooks would add many sites for little value.
- **Changed — no GPU timing.** `withPerformanceCallback` exists (`core/pipeline/timeable.ts`), needs `timestamp-query`, adds readbacks. Out of scope; CPU durations are labelled CPU.
- **Changed — "compile time".** Existing `PerformanceTracker.measureCompile` awaits `queue.onSubmittedWorkDone` (`performanceTracker.ts:26`); that is queue drain, not compilation. We do not reuse it.
- **Changed — real-GPU tests.** The research cites `pnpm test:gpu`/`gpuIt`; they do **not** exist at this commit (`packages/typegpu-testing-utility/src/gpu.ts` missing). Tests run on the mock device (`typegpu-testing-utility`, `src/extendedIt.ts`; no `lost`, `addEventListener` or `getCompilationInfo`, so tests supply them). A real-device smoke check is attempted separately and reported as such.
- *(verified)* `garbageCollection.test.ts` asserts root + resources are collectable → a strong registry would break it; the POC must keep that test green with instrumentation **enabled**.

## 3. API sketch (unstable)

```ts
// Opt-in only at root creation:
const root = tgpu.initFromDevice({ device, unstable_instrumentation: true });   // or { historySize: 256 }
const inst = root['~unstable'].instrumentation;       // undefined when not opted in

interface TgpuInstrumentation {
  readonly enabled: boolean;
  enable(): void;                    // resume recording (no-op after dispose)
  disable(): void;                   // stop recording; hooks become a pointer check again
  subscribe(listener: (e: TgpuInstrumentationEvent) => void): () => void;
  history(): readonly TgpuInstrumentationEvent[];   // last <= historySize events, oldest first
  getSnapshot(): TgpuInstrumentationSnapshot;       // plain, structuredClone-able, no TypeGPU objects
  dispose(): void;                   // permanent: unsubscribe all, remove device listeners
}
```

Semantics:
- **Disabled** = the option was absent: `root.instrumentation === undefined`; nothing is attached.
- **Enabled** = created with the root. `disable()`/`enable()` toggle recording only; resources created while disabled are untracked (their later `destroy` is ignored). No late attach (a documented limitation: earlier resources can't be seen).
- Delivery is **synchronous** inside the hook, in `seq` order; a throwing listener is isolated (counted in `counters.listenerErrors`). Listeners must not call back into TypeGPU (undefined re-entrancy).
- A history ring of `historySize` (default 256) events exists because device errors and compile events are transient and a consumer may attach late; counters and live state come from the snapshot instead.

### Event envelope and schema (`v: 1`)

`{ v: 1, seq: number, t: number, type: … }` — `seq` monotonic per root; `t` = `performance.now()` (CPU clock, ms).
All payloads are primitives/plain arrays; ids are per-root integers, never object references.

| `type` | Payload | Provenance |
|---|---|---|
| `resource-materialized` | `resource: 'buffer'\|'texture'`, `id`, `label`, buffer: `sizeBytes`, `usage` (flags number); texture: `format`, `size`, `mipLevelCount`, `sampleCount`, `dimension`, `usage` | observed (values passed to `createBuffer`/`createTexture`) |
| `resource-destroyed` | `resource`, `id`, `label` | observed (`destroy()` of an owned, tracked resource) |
| `bind-group-created` | `id`, `label`, `layoutId`, `origin: 'created'\|'adopted'`, `entries: {name, kind: 'buffer'\|'texture'\|'sampler'\|'other', resourceId: number\|null}[]` | observed; `resourceId: null` = raw/untracked (explicitly unknown) |
| `pipeline-compiled` | `id`, `pipeline: 'compute'\|'render'`, `label`, `trigger: 'lazy'\|'initSync'\|'initAsync'`, `resolveMs`, `createMs`, `wgsl`, `layoutIds`, `layoutLabels` | `wgsl` observed; `trigger` derived from the entry point; `resolveMs` CPU time of TypeGPU's resolve; `createMs` CPU time of a synchronous `createXPipeline` call, or wall time until the promise resolved for async (**not** GPU time, **not** compile-only time) |
| `shader-diagnostics` | `pipelineId`, `messages: {type, message, lineNum, linePos}[]` | observed (`GPUShaderModule.getCompilationInfo()`); line numbers refer to the **generated WGSL**; emitted even when empty ("checked, no messages") |
| `device-error` | `errorType` (constructor name), `message` | observed (`uncapturederror`) |
| `device-lost` | `reason`, `message` | observed (`device.lost`) |
| `root-destroyed` | `ownDevice`, `liveBuffers`, `liveTextures` | `live*` derived from tracked, non-GC'd, non-destroyed resources |

### Snapshot

`{ v: 1, t, enabled, resources[], bindGroups[], pipelines[], counters, unavailable[] }`.

- `pipelines[]` carries `{id, pipeline, label, trigger, wgsl, layoutIds, counters: {dispatches|draws}}`; label is read live from the object (so `$name` after creation is reflected; *derived*).
- `counters`: `submits` (**only `TgpuCommandEncoder.submit()`**; direct `queue.submit` calls inside buffer/texture helpers and user code are not counted), `collectedWithoutDestroy` (nondeterministic GC timing; a hint, not a measurement), `droppedEvents`, `listenerErrors`. Per resource: `writes`, `bytesWritten` (TypeGPU-mediated `write`/`patch` only).
- `unavailable`: machine-readable list of what this layer cannot provide, e.g. `gpuExecutionTime`, `gpuMemoryUsage`, `wrappedResources`, `internalResources` (staging/mipmap helpers), `rawWebGPUCalls`, `workgroupCounts`, `perDispatchBindings`.
- Estimates: none are produced. (Texture memory is *not* estimated.)

## 4. Instrumentation points (all existing paths)

| Hook | Where | Reads |
|---|---|---|
| root creation, device listeners | `core/root/init.ts` `TgpuRootImpl` constructor (l.358), `init` (l.671), `initFromDevice` (l.727) + `InitOptions`/`InitFromDeviceOptions` | `unstable_instrumentation` |
| root teardown | `TgpuRootImpl.destroy` (`init.ts:470`) | live counts |
| buffer materialize / destroy / writes | `buffer.ts:276` (only when `createBuffer` runs), `:569`, `:433,485,490` | descriptor values |
| texture materialize / destroy | `texture.ts:333`, `:681` | `props`, flags |
| bind group created | root `WeakMemo` for bind groups, `init.ts:351` | `bindGroup.layout`, `.entries` |
| pipeline compile (compute) | `ComputePipelineCore.resolveAndCreateShaderModule` (l.571), `initSync` (l.534), `initAsync` (l.501), `unwrap` (l.566, marks `lazy`) | `resolutionResult.code`, `usedBindGroupLayouts` |
| pipeline compile (render) | same methods at `renderPipeline.ts:967,935,901,962` | same |
| dispatch / draw counters | `emitComputeDispatch` (`drawState.ts:353`), `emitRenderDraw` (:312) | `pipeline[$internal].core` |
| submit counter | `TgpuCommandEncoderImpl.submit` (`commandEncoder.ts:121`) | — |

Not hooked on purpose: samplers, query sets, vertex layouts, `encoder.finish()`, raw `unwrap` escape hatches, direct `queue.submit` in helpers.

## 5. Disabled-mode behavior

- Hook sites: `const inst = root[$internal].instrumentation; if (inst !== undefined) { … }`. No allocation, no timers, no registry, no listeners, no `getCompilationInfo` call, no `performance.now()`.
- The module is only imported for types plus the hub constructor used when the option is present.
- Compared against **pristine upstream** (not just "disabled vs enabled"), in §7.

## 6. Memory and lifecycle strategy

- Ids: per-hub `WeakMap<object, number>` (no strong refs to resources).
- Live registry: `Map<id, { ref: WeakRef<object>, … }>` + one `FinalizationRegistry` (held value = id only) that removes entries on GC and bumps `collectedWithoutDestroy` when the object was never destroyed. Snapshots also skip entries whose `deref()` is `undefined`.
- Records hold primitives and one WGSL string per live pipeline; history holds ≤ `historySize` events; WGSL strings are shared by reference, not duplicated.
- Events never reference TypeGPU/GPU objects. Hub holds only `device` (for listeners), not `root`.
- `dispose()` removes `uncapturederror` listener and subscribers. After `root.destroy()`: for a TypeGPU-owned device the `lost` handler is kept until it fires (to report `reason: 'destroyed'`); otherwise the hub is disposed.
- Must keep `tests/garbageCollection.test.ts` passing with instrumentation on (new test mirrors it).

## 7. Known limitations and non-goals

Limitations: sees only TypeGPU-mediated calls; wrapped resources invisible; no late attach; synchronous delivery; `uncapturederror` is per device, so several roots on one device each see the same error; whether listener presence changes the browser's console behaviour is untested; labels in browser error messages are expected (TypeGPU sets them) but only confirmed on the mock here.

Non-goals: UI, browser extension, framework adapters, frame capture/replay, buffer/texture contents, GPU timing, GPU memory, source maps TS↔WGSL, persistence/telemetry, a stable API.

## 8. Success and stop criteria

Success (all required):
1. Default off: with no option, `root.instrumentation === undefined`, no device listeners added, no `getCompilationInfo` calls (test).
2. Events/ordering/subscribe/unsubscribe/enable/disable/ring bound/teardown behave as specified (tests).
3. `garbageCollection`-style test passes with instrumentation **on**; records for collected objects disappear.
4. Two independent consumers (text report; a different structured projection) work from the same stream, import no DOM/UI, and need no TypeGPU internals.
5. Disabled-mode overhead vs pristine upstream on a dispatch/draw/write microbenchmark is within measurement noise; method and variance reported (target: |Δ median| ≤ 2% with non-overlapping noise considered).
6. Enabled mode: zero event allocation on dispatch/draw (counter path), bounded heap growth over a long run.
7. Hook patch to existing files stays small (target ≤ ~150 changed lines).

Stop / revise:
- Disabled overhead > 3% median reproducibly and not fixable by trivially restructuring a hook.
- GC test fails with instrumentation on.
- A consumer cannot be written without TypeGPU object references (the DTO boundary is wrong).
- The patch needs invasive changes to call signatures beyond a flag on `initSync`.
- Real-device smoke check shows `getCompilationInfo`/`uncapturederror` unusable in a way that undermines U1/U3 (reported, then scope reassessed).
