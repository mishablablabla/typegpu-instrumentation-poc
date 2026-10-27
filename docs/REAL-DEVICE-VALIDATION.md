# Real-device validation

> **Update.** The final multi-environment results (Chrome headless and headed, a SwiftShader software adapter, Safari 26.3) and the support matrix are in [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md). Event names in this older document predate the v2 rename (`pipeline-compiled` is now `pipeline-created`).

What was run on an actual GPU, what it showed, and what it did not. Everything here is **[verified]** (produced by `real-gpu/run.mjs`, raw output in `real-gpu/results/`) unless marked otherwise. Mocked tests are listed separately in §5 and are never counted as real-GPU evidence.

## 1. Environment

| | |
|---|---|
| Machine | MacBook, Apple M3 Pro, macOS 26.3 (arm64) |
| Browser | Google Chrome 156.0.8078.48 (installed locally), `--headless=new`, throwaway profile, flag `--js-flags=--expose-gc` only (no WebGPU flags) |
| Adapter, as the page sees it | `vendor: apple`, `architecture: metal-3`, `info.isFallbackAdapter: false` |
| GPU process, as the browser reports it | `ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Version 26.3)` |
| TypeGPU | upstream `7c853fa3` + the hook patch in this repo, bundled with TypeGPU's own `unplugin-typegpu` and Vite, `NODE_ENV=production` |

"Real GPU" here means: two independent sources agree. The page says the adapter is not a fallback; the browser's GPU process lists a hardware device. The classification is `real-gpu/classify.ts` (unit-tested). Neither source is a proof of silicon execution, but together they exclude the known software paths (SwiftShader, llvmpipe) and the harness refuses to call anything else real.

## 2. How to run it

```bash
scripts/setup.sh                       # once
node real-gpu/run.mjs                  # builds the page, launches Chrome, drives it over CDP, writes real-gpu/results/<stamp>.json
node real-gpu/run.mjs --headed         # same with a visible window
node real-gpu/run.mjs --chrome-arg=--use-webgpu-adapter=swiftshader   # negative path (see §4)
```

No npm dependencies are installed: Chrome is controlled over the DevTools protocol with Node's built-in `WebSocket`. Exit codes: `0` validated on a hardware adapter · `1` a check failed · `2` **not validated** (no WebGPU, software, or unverified adapter) · `3` harness error. `--allow-software` runs the scenario on a non-hardware adapter, still labelled `SOFTWARE ADAPTER - not real-GPU validation` and still exit 2.

## 3. Result: all checks pass on the hardware adapter

Three consecutive runs with 18 checks (`2026-10-27T14-59-46`, `…49`, `…52`), then the 19th check (`gc-real-device`) was added and passed in `15-00-53`. All runs classified `hardware-adapter`. Headed mode (`--headed`) exists but was not run. The suite now has 20 checks (`buffer-writes` was added); the latest full run is `2026-10-27T15-15-16`, 20 of 20. The bundled scenarios are checked on the hardware adapter by `real-gpu/check-examples.mjs` (21 checks, passing).

| Check | What it proves on the real device |
|---|---|
| `init` | `tgpu.init({ unstable_instrumentation })` on a real adapter yields an enabled hub |
| `compute-result` | the GPU really ran the generated WGSL: readback equals input × 3 |
| `pipeline-event` | one `pipeline-compiled`, `trigger: 'lazy'`, WGSL contains the compute function |
| `diagnostics-valid` | `getCompilationInfo()` on a real valid module: no errors |
| `resources` | buffers materialize with real sizes, before the bind group |
| `bind-group` | entries resolve to the tracked buffers |
| `counters` | 1 dispatch, ≥ 1 submit |
| `buffer-writes` | a TypeGPU `write` is counted per buffer with its byte size (added with the usable-output milestone) |
| `render` | render pipeline compiles lazily, 1 draw counted, no device error (**output not read back**) |
| `diagnostics-error` | for invalid WGSL the browser's error `lineNum` points at the line of the **generated** WGSL containing the bad identifier |
| `device-error` | an invalid pipeline surfaces as an uncaptured `GPUValidationError` event |
| `async-failure-event` | `initAsync()` of an invalid shader emits `pipeline-compile-failed` with the WGSL, then the compiler error (**this was a bug, §6**) |
| `resource-destroyed`, `root-destroyed` | destroy event; leftover buffers/textures reported on `root.destroy()` |
| `device-lost-owned` | destroying a device the root owns gives `device.lost` reason `destroyed` and a `device-lost` event |
| `seq` | contiguous sequence numbers, history bounded |
| `raw-error-event` | a raw validation error is delivered exactly once, and not after `dispose()` |
| `device-lost-borrowed` | direct `device.destroy()` on a borrowed device: `device-lost` event, hub still attached |
| `leak-after-loss` | `root.destroy()` on a borrowed root reports the buffer TypeGPU never destroyed |
| `gc-real-device` | with the real device alive, root, buffer and pipeline are collected and the registry forgets them (`collectedWithoutDestroy` = 1) |

## 4. Observations on the real implementation (previously only assumptions)

1. **A listener does not change what the browser prints.** The same raw validation error produced one console/log entry with our `uncapturederror` listener installed and one after `dispose()` removed it. The browser still reports every error; the instrumentation neither hides nor duplicates it.
2. **Labels reach the error text.** Messages name `bogus-texture` (a raw label) and `brokenSync - Shader` (TypeGPU's `<name> - Shader` label). TypeGPU's labelling therefore gives usable attribution.
3. **…but not reliably for identical WGSL.** Two pipelines with the same source: the async rejection for `brokenAsync` names the module `brokenSync - Shader`, i.e. Dawn handed back the first identical module (label from the first). Do not attribute an error to a pipeline from the label alone when two pipelines share source.
4. **Synchronous creation cannot report validity.** An invalid sync pipeline gives `pipeline-compiled`, then `shader-diagnostics` with errors, then two `device-error`s (module parse, pipeline). The async path rejects with `GPUPipelineError` (plus one uncaptured shader-module error). This is documented on the event type.
5. **CPU timings are coarse.** `performance.now()` advances in 0.1 ms steps in a normal page, so `resolveMs`/`createMs` (typically 0.5–3 ms) carry up to 10–20 % quantisation. Documented on the event envelope.
6. **API drift:** in Chrome 156 `isFallbackAdapter` lives on `adapter.info`; `adapter.isFallbackAdapter` is `undefined`. An adapter can create only one device, so every additional device needs its own `requestAdapter()`.
7. **Unreachable TypeGPU objects disappear from snapshots.** V8 collected pipelines that the harness no longer referenced, and the snapshot correctly stopped listing them. It follows that snapshots show what the application can still reach, and a pipeline recreated every frame will show as repeated `pipeline-compiled` events rather than one growing list.

Negative path: `--chrome-arg=--use-webgpu-adapter=swiftshader` made WebGPU unavailable in this Chrome; the harness reported `NOT RUN - WebGPU unavailable` and exited 2 (`real-gpu/results/2026-10-27T14-59-01-341Z.json`). A real software *adapter* could not be produced here, so that classification branch is covered by unit tests only.

## 5. Real GPU vs mocks

| Claim | Real device | Mock / unit tests |
|---|---|---|
| Events, ordering, counters, lifecycle | yes (above) | yes (44 tests) |
| `getCompilationInfo` messages and positions | yes | shape only |
| `uncapturederror` delivery and error text | yes | simulated |
| `device.lost` `destroyed` | yes (owned and borrowed) | simulated |
| GC and no root retention | yes (Chrome/V8 + real device) | yes (Node/V8) |
| Disabled-mode overhead | **no** | Node microbenchmark only |
| Unknown device loss (GPU reset/crash) | **no** (cannot be triggered) | simulated |
| Other browsers, OSes, GPU vendors | **no** | – |
| GPU execution time | **not claimed** (no timestamp queries used) | – |

## 6. Bugs found, and their regression tests

| Bug | Found by | Fix | Regression test |
|---|---|---|---|
| Hub kept the whole root alive (closure scope shared with `super(() => this)`) | mock GC test | publish into a plain holder | `instrumentation.test.ts` GC test; `gc-real-device` |
| Per-dispatch hook cost ~5 ns on the lightest path | A/A-controlled benchmark | hub read once per pass | benchmark; "stops counting in a pass opened before disable()" |
| `initAsync()` of an invalid shader reported nothing | first real-device run | `pipeline-compile-failed` event + diagnostics | two mock tests (compute, render), consumer test, `async-failure-event`, untouched-rejection test with instrumentation off |
| Harness treated `isFallbackAdapter === undefined` as "not a fallback" | review of the first real run | two-source classification | `classifyExecution.test.ts` (regression case included) |
| Harness reused one adapter for several devices | first real run | one adapter per device | the scenario itself |

## 7. Not verified, and what would settle it
- Behaviour on other browsers (Safari, Firefox), Windows/Linux, discrete GPUs: run `real-gpu/run.mjs --chrome <path>` there.
- A genuine device loss (driver reset): needs a way to provoke one; `reason: 'unknown'` handling is exercised only by a simulated device.
- Rendered pixels: the render draw is counted and error-free but its output is not read back.
- Overhead in a real browser with real WebGPU calls (the benchmark uses a mock device in Node).
