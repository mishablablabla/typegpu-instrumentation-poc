# POC results

Baseline: upstream TypeGPU `7c853fa3` · Node v24.21.0 · pnpm 11.1.2 · Vitest 4.1.11 · macOS (Darwin arm64).
Design and criteria: [POC-DESIGN.md](POC-DESIGN.md). Raw benchmark data: [../bench/results/](../bench/results/) (`SUMMARIES.md` has every run).

Labels: **[measured]** = produced by a test or benchmark in this repo; **[derived]** = follows from the code, not run; **[not done]** = could not be verified here.

## 1. Recommendation (up front)

**Proceed.** Update after the real-device milestone: the main condition of the first report is now met (see [REAL-DEVICE-VALIDATION.md](REAL-DEVICE-VALIDATION.md)): all 19 checks pass on an Apple M3 Pro through Chrome 156, and the run found and fixed a real gap (async pipeline failures were silent). Remaining conditions: other browsers/OSes, an in-browser overhead measurement, and the unmeasured bundle size. The first report's reasoning follows. The thin layer worked: the useful TypeGPU-specific data came from 10 files and about 250 touched lines in the existing core, two unrelated consumers read the same stream without any TypeGPU internals, and disabled-mode cost could not be told apart from measurement noise. Before a production implementation: re-measure overhead in a real browser engine (§5 limits) and repeat the real-device run on other browsers and GPUs.

## 2. What was implemented

| Piece | Where | Size |
|---|---|---|
| Hub: per-root state, event emission, bounded history, weak registry, counters, device listeners | `overlay/src/hub.ts` | 591 lines |
| Public unstable data model (events, snapshot, interface) | `overlay/src/types.ts` | 226 lines |
| Hook patch into existing TypeGPU files | `patches/0001-instrumentation-hooks.patch` | 10 files, +210 / −37 |
| Tests | `overlay/tests/` | 44 tests in 3 files |
| Real-device harness | `real-gpu/` | Chrome over CDP, 19 checks, see REAL-DEVICE-VALIDATION.md |
| Two consumers | `consumers/textReport.ts`, `consumers/diagnosticsIndex.ts` | 77 + 128 lines |
| Benchmark | `bench/overhead.test.ts`, `scripts/bench.sh`, `bench/summarize.mjs` | |

Opt-in: `tgpu.init({ unstable_instrumentation: true | { historySize } })` or `initFromDevice(...)`; consumers use `root['~unstable'].instrumentation` (`undefined` when not opted in).

**Missed target:** the design aimed at ≤ ~150 changed lines in existing files; the patch is now 247 (210 added, 37 removed; it was 179 before the real-device milestone added the async-failure event, ~40 lines across the two pipeline files). Part of it is wrapping from the repo's formatter and the descriptor hoisting in `buffer.ts`/`texture.ts` (needed so the *observed* descriptor is what is reported). The two pipeline files now carry the same hook block twice (compute/render): a shared helper would shrink it.

## 3. The actual model

Delivered as `{ v: 1, seq, t, type, … }` (`t` = `performance.now()`), plain data only:

| Event | Observed / derived |
|---|---|
| `resource-materialized` (buffer, texture) | observed: size/usage or format/size/mips/sampleCount/dimension/usage as passed to `createBuffer`/`createTexture` |
| `resource-destroyed` | observed |
| `bind-group-created` | entries → `resourceId` of the tracked resource, or `null` = unknown (raw `GPUBuffer`, or created while disabled) |
| `pipeline-compiled` | observed: exact WGSL given to `createShaderModule`; derived: `trigger` (`lazy`/`initSync`/`initAsync`); `resolveMs`, `createMs` are **CPU** times and `createMs` is neither GPU time nor pure compile time |
| `shader-diagnostics` | observed: `getCompilationInfo()` messages (positions refer to the generated WGSL); empty = asked, nothing reported |
| `device-error`, `device-lost` | observed |
| `pipeline-compile-failed` | observed: async creation rejected; carries the WGSL, the rejection's type and message (added after the first real-device run) |
| `root-destroyed` | derived: live buffers/textures at that moment (leak indicator) |

Snapshot (`getSnapshot()`): live resources / bind groups / pipelines with counters (dispatches, draws, per-buffer writes and bytes), `submits`, `collectedWithoutDestroy`, `droppedEvents`, `listenerErrors`, and a machine-readable `unavailable` list (`gpuExecutionTime`, `gpuMemoryUsage`, `wrappedResources`, `internalResources`, `rawWebGPUCalls`, `workgroupCounts`, `perDispatchBindings`, `textureMemory`). No estimates are produced anywhere.

API: `enabled`, `enable()`, `disable()`, `subscribe()`, `history()`, `getSnapshot()`, `dispose()`.

## 4. Use cases demonstrated [measured: tests]

| Use case | Demonstrated by |
|---|---|
| U1 What WGSL was generated / what did the compiler say | `instrumentation.test.ts` "reports a lazy compile…", "carries compiler messages…"; `consumers.test.ts` diagnostics index attaches the offending **generated WGSL line** to a diagnostic |
| U2 First-frame hitch = lazy compile | `trigger: 'lazy'` on first dispatch/draw vs `initSync`/`initAsync` (test "distinguishes explicit initSync…"); both consumers surface it |
| U3 Nothing drawn / what is bound | device-error events carry the error type and message; bind-group entries map to resource ids with explicit `null` for the unknown ones |
| U4 Leaks | `resource-destroyed`; `root-destroyed.liveBuffers` (with a borrowed device TypeGPU does not destroy resources on `root.destroy()`, so the leftover count is exactly the leak); consumer 2 rebuilds the live set from events alone |
| U5 Churn | per-pipeline dispatch/draw counters; per-buffer `writes`/`bytesWritten`; `submits` |

Consumers: (1) text report; (2) a reducer that folds the same events into findings grouped by question. A test asserts the consumer sources import only the type module (no UI/DOM/TypeGPU runtime), and that a consumer attached late reconstructs identical state from history.

## 5. Tests and benchmark

### Tests [measured]
- New: 44 tests in 3 files, all passing (`scripts/test.sh`); the third file unit-tests the real-device run classification. Covers: off by default and nothing attached to the device; event content and ordering (`pipeline-compiled → resource-materialized → bind-group-created → shader-diagnostics`, `seq` contiguous); subscribe/unsubscribe, multiple consumers, throwing listener isolated and counted, unsubscribing from inside a listener; ring bound (`historySize: 3` keeps `[3,4,5]`, `droppedEvents = 2`; `historySize: 0` still delivers); enable/disable/dispose; errors and device loss (also ignored while disabled); teardown with a borrowed vs an owned device; `structuredClone` of snapshots; GC compatibility.
- Existing TypeGPU suite with the patch applied (instrumentation off): **2955 → 2999 tests pass** (201 files; +44 are my tests, +1 is the benchmark file, which Vitest also runs as one test); `tsc` and the repo's `oxlint`/`oxfmt` are clean. A from-scratch `scripts/setup.sh` in a fresh copy reproduces the same state.
- Mock-device limits [not done on real GPU]: the shared mock has no event target, `lost` or shader diagnostics; the tests add exactly those. Event *shapes* follow the spec/MDN (see research doc), but no real implementation was exercised.

### Disabled-mode overhead [measured, with limits]
Setup: plain-function mock device (no `vi.fn`, which records every call), Vitest/Node, 40 samples × 20 000 calls per process, 9 fresh processes per configuration, configuration order rotated each repetition, medians of process medians. Configurations: `pristine` (upstream, no patch), `pristine-b` (identical A/A control), `disabled` (patched, option not passed), `enabled`. Final run (`20261027-153954`):

| Operation | pristine ns/op | pristine-b | disabled | enabled | A/A spread of pristine |
|---|---|---|---|---|---|
| dispatch (own encoder) | 336.2 | −0.8 % | +0.5 % | +2.1 % | 6.2 % |
| dispatch (open pass)  | 37.8 | −0.6 % | −8.3 % | +6.6 % | 6.9 % |
| draw (own encoder) | 432.2 | −0.4 % | +0.1 % | +1.4 % | 4.4 % |
| buffer.write | 336.8 | −2.6 % | +3.7 % | +5.2 % | 6.5 % |

Reading: disabled vs pristine is within the A/A noise (deltas −8 % … +4 %; the −8 % on a 38 ns operation is ~3 ns) **but the 2 % target from the design cannot be demonstrated** at this resolution. Enabled costs roughly +1…7 % on these paths (~+5 ns for the counter increment on the lightest path).

Event volume / allocation in the enabled run (≈3 M hot calls): **6 events total** (all cold: compile, materialize…), 0 dropped; minor-GC counts per 200 k operations are **identical** to pristine (24 / 1 / 35 / 2), i.e. no extra per-call allocation visible at this resolution (a GC count is a proxy, not an allocation profiler).

### What the measurements first said, and what changed [measured]
1. First runs (3 configs, before any change): disabled was **+5 % … +17 %** vs pristine on all operations; on the lightest path +6 ns/call (+16.8 %, above the pristine spread).
2. A/A control (identical second pristine tree): bias −4 … +0.1 %, so the lightest-path gap was real, the others mostly noise.
3. Hypothesis "`initSync` grew and is no longer inlined into `unwrap()`": restructured `unwrap()`; gap **stayed** (+13.9 %). Hypothesis not supported.
4. Diagnostic run with only the `dispatched()` hook removed: gap disappeared (−6.9 %). So the cost was the hook line itself, `root[$internal].instrumentation?.…`, per call.
5. Change: passes read the hub once at creation and keep it in `passInternals`; the hub re-checks `enabled` (so a pass opened before `disable()` stops counting; test added). Final run above: gap gone.

Limits of all numbers: mock device (real WebGPU calls cost far more per operation, so the *relative* cost would be smaller, but that is [derived], not measured); one machine, one OS, one engine (V8 in Node, not browsers: JSC/SpiderMonkey may inline differently); no CPU isolation; micro-benchmarks of 35–450 ns operations are sensitive to code layout (the first-run gaps shows how); bundle size and tree-shaking were **not** measured. Next experiment: same three configurations in a real Chromium page (`apps/typegpu-docs` browser harness) with a real device, plus `apps/treeshake-test` for the bundle effect.

## 6. Memory and lifecycle findings [measured]
- The registry is `WeakRef` + one `FinalizationRegistry`; ids via `WeakMap`. Test "does not keep the root or its resources alive": a root, buffer, texture, bind group and pipeline are all collected while the device (which keeps the hub alive) is still referenced; afterwards the snapshot lists nothing and `collectedWithoutDestroy` is 2 (buffer and texture; timing-dependent, a hint).
- **A real bug was found this way:** the first version published itself to the root through a callback created in `TgpuRootImpl`'s constructor. V8 shares one scope object between closures of a scope, and `super(() => this, [])` puts `this` in it, so the hub (kept alive by the device's listener and `lost` promise) kept the whole root alive. The GC test failed; the hub now publishes into a plain holder object. Any future hook that keeps a closure from a constructor must be checked the same way.
- History is bounded: 500 buffers with `historySize: 8` leave 8 events, `droppedEvents = 492`, and the snapshot holds fewer than 500 resources after GC.
- Retention that remains by design: one WGSL string per *live* pipeline (shared with the newest events, not duplicated); the hub lives as long as the device (bounded; `dispose()`/`root.destroy()` detaches listeners). Several roots on one device each get every device error.

## 7. Instrumentation points in the source [derived from the audit, exercised by tests]
Buffers: `core/buffer/buffer.ts` (`materialize`, `write`, `patch`, `destroy`); textures: `core/texture/texture.ts`; bind groups: the root's `WeakMemo` in `core/root/init.ts`; pipelines: `resolveAndCreateShaderModule`/`initSync`/`initAsync`/`unwrap` in `computePipeline.ts` and `renderPipeline.ts`; dispatch/draw: `emitComputeDispatch`/`emitRenderDraw` in `core/pipeline/drawState.ts` (hub read from the pass); submit: `TgpuCommandEncoderImpl.submit`; root: constructor/`destroy` and the `unstable_instrumentation` option. Full list with lines in POC-DESIGN §4 (line numbers have shifted by the patch).

## 8. What remains unavailable
- Through ordinary WebGPU: GPU execution time except via opt-in `timestamp-query` (not used here), GPU memory, driver/ISA/occupancy, enumeration of live objects, resource contents without a readback. Cited from primary sources in the research doc.
- Through this layer by design: wrapped `GPUBuffer`/`GPUTexture`, TypeGPU's internal helper resources (staging, mip generation), raw WebGPU calls and `encoder.finish()` submissions, per-dispatch bind groups and workgroup counts (the hook sees only an opaque closure), samplers/query sets, async pipeline-creation *failures* (they reject only to the caller). `submits` counts `TgpuCommandEncoder.submit()` only.
- Real implementation: now checked on one device (Apple M3 Pro, Chrome 156); results and the remaining unverified items (other browsers/OSes, a genuine device reset) are in [REAL-DEVICE-VALIDATION.md](REAL-DEVICE-VALIDATION.md). Async pipeline-creation failures, listed above as unreported in the first version, are now reported (`pipeline-compile-failed`).

## 9. Architectural and public-API risks
| Risk | Status |
|---|---|
| Closure/GC retention through the hub | found and fixed once; needs a standing GC test (exists) |
| Hot-path cost depends on how a hook reads state | observed: one extra property chain cost ~5 ns; fixed by caching in the pass; other hot paths (`buffer.write`) still read `root[$internal]` per call (+3.7 % disabled, within noise) |
| Surface area: every new resource type needs a hook + DTO + test | unchanged from design |
| Hooks are bypassed by raw WebGPU, `unwrap`, `adopt*`, helper submits | permanent; documented via `unavailable` |
| Passes keep the hub they saw at creation | handled by the `enabled` re-check; adds a branch in enabled mode only |
| `~unstable` label on a typed property of the root | fine for POC; stable API would need versioned events (`v: 1` exists) |
| Error attribution/console behaviour with a listener present | verified on one real device: a listener does not change console output; labels appear in messages but are unreliable for pipelines with identical WGSL (REAL-DEVICE-VALIDATION §4) |
| Patch size 247 lines for 7 event kinds | acceptable for POC; production should look for a smaller funnel |
| Browser/engine differences in inlining | **unmeasured** |

## 10. Keep, change, discard
**Keep:** per-root opt-in at creation; DTO-only events with ids and `v`; the weak registry + finalizer; bounded ring; hooks only on existing funnels; consumers depending on types only; the `unavailable` list and the observed/derived labelling; A/A-controlled benchmarking.

**Change before production:** validate on real devices first; hook `buffer.write`/`patch` and other per-call sites through a cheaper path than `root[$internal]` or accept and document the cost; shrink the patch; add a pipeline-creation-failure event if real devices show it is the common failure; decide whether `collectedWithoutDestroy` is worth keeping given its timing dependence; export the types through a public path instead of relative imports; consider a build-time gate (`DEV`-style, as the existing `PERF`) to make the disabled cost literally zero in production bundles; measure bundle size.

**Discard:** workgroup counts, GPU timing, any memory estimate (as already cut), and the idea of a global hook for the POC (per-root was enough).

## 11. Final recommendation
**Proceed.** The real-device experiment recommended in the first report has been done on one device: error and compilation events behave as assumed, a listener does not change browser error reporting, and one real gap was found and fixed. The overhead three-way benchmark was re-run on the final patch (`bench/results/20261027-160102.jsonl`): disabled stays within the A/A noise. What still stands between this and production is breadth (other browsers/GPUs), an in-browser overhead measurement, and bundle-size measurement.
