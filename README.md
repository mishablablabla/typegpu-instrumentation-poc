# typegpu-instrumentation-poc

An opt-in **instrumentation and diagnostics layer for [TypeGPU](https://github.com/software-mansion/TypeGPU)**: a stream of plain-data events (resources, bind groups, pipelines, shader diagnostics, device errors, teardown) plus a snapshot of what is alive, meant as the data foundation for developer tooling. Framework-agnostic, no UI, no GPU timing.

Status: **evaluated for production readiness, not published**. The verdict and its evidence are in [docs/PRODUCTION-READINESS.md](docs/PRODUCTION-READINESS.md). Everything is `unstable_`: see the compatibility policy in [docs/EVENT-CONTRACT.md](docs/EVENT-CONTRACT.md).

| Read | |
|---|---|
| [docs/PRODUCTION-READINESS.md](docs/PRODUCTION-READINESS.md) | verdict, acceptance matrix with evidence, defects found, remaining limits |
| [docs/EVENT-CONTRACT.md](docs/EVENT-CONTRACT.md) | what each event means, ordering guarantees, what is not promised |
| [docs/ARCHITECTURE-DECISION.md](docs/ARCHITECTURE-DECISION.md) | design, lifecycle model, alternatives evaluated |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | CPU overhead and bundle cost, method and raw data |
| [docs/ACCEPTANCE-MATRIX.md](docs/ACCEPTANCE-MATRIX.md) | the requirements, written before the work |
| [docs/VIABILITY-REPORT.md](docs/VIABILITY-REPORT.md), [REAL-DEVICE-VALIDATION.md](docs/REAL-DEVICE-VALIDATION.md), [POC-*](docs/) | history: the earlier milestones (some numbers there are superseded; PERFORMANCE.md says which) |

## Use it

Requires a TypeGPU that contains the hook patch in this repo (`patches/`), and a browser or runtime with WebGPU.

```ts
import tgpu from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';

const root = await tgpu.init({
  unstable_instrumentation: createInstrumentation({ historySize: 256, historyMaxBytes: 4 * 1024 * 1024 }),
});
const inst = root['~unstable'].instrumentation!;   // undefined when not opted in

const off = inst.subscribe((event) => console.log(event.type, event));   // synchronous, in `seq` order
inst.history();       // the most recent events (bounded by count and bytes)
inst.getSnapshot();   // live resources / bind groups / pipelines, counters, retainedFailures, `unavailable`
inst.dispose();       // permanent; history and snapshot stay readable
```

- Not importing `typegpu/unstable-instrumentation` ships **no** hub code (measured in four bundlers, [docs/PERFORMANCE.md](docs/PERFORMANCE.md)).
- Options: `historySize` (events, default 256), `historyMaxBytes` (estimated payload, default 4 MiB), `captureSource` (keep the generated WGSL, default `true`). Invalid options throw a `RangeError` when the root is created.
- Two ready-made consumers live in [consumers/](consumers/) (console lines, JSON Lines export and a version-checking reader); they only build text and let you choose the sink.
- What the layer does **not** see is listed in `snapshot.unavailable` and in the contract: helper submissions (`buffer.read/clear/copyFrom`, texture utilities, query sets), wrapped GPU objects, restored/precompiled pipelines, samplers, texture views, render bundles, raw WebGPU calls. No GPU execution time anywhere.

### Troubleshooting

| Symptom | Cause |
|---|---|
| `root['~unstable'].instrumentation` is `undefined` | the option was not passed, or TypeGPU has no hook patch (it silently ignores the option; `consumers/requireInstrumentation.ts` turns that into an error) |
| `unstable_instrumentation expects the value of createInstrumentation()` | you passed `true`; the boolean form of the prototype is gone |
| a pipeline "compiled" but the shader is broken | `pipeline-created` with `validation: 'deferred'` only says the call returned; look for `shader-diagnostics` with errors and `device-error` |
| no `device-error` for a broken pipeline | Safari does not always report one; `shader-diagnostics` is then the only signal |
| events stop | the layer switched itself off after an internal error: `getSnapshot().counters.internalErrors` / `lastInternalError`; an exception is also reported through `reportError` |
| objects created while `disable()`d never show up | by design, see the contract |

## See the output of a scenario on the real GPU

A scenario is an ordinary single-file TypeGPU program (`export default async (root) => { … }`, see [examples/](examples/)). The harness runs it in your locally installed Chrome on the real GPU with instrumentation on, prints the events and can write JSONL.

```bash
scripts/setup.sh                       # once (pnpm 11, Node >= 24, network or TYPEGPU_UPSTREAM=<local clone>)
node real-gpu/run.mjs --example examples/per-frame-churn.ts --jsonl out.jsonl
```

Recorded outputs on the author's machine (Apple M3 Pro, Chrome 156) are in [real-gpu/results/scenarios/](real-gpu/results/scenarios/), one per question the instrumentation answers:

| Scenario | Question | What the output shows |
|---|---|---|
| [compute-scale](examples/compute-scale.ts) | what did my program create and run? | lazy compile, buffers, bind group, counters, teardown |
| [broken-shader](examples/broken-shader.ts) | why did `initAsync` reject? | `creation FAILED [initAsync, create]` with the compiler error and its position in the *generated* WGSL |
| [sync-invalid-shader](examples/sync-invalid-shader.ts) | `initSync` returned, so why does nothing happen? | `created [initSync]` (validity deferred), then the device errors and the compiler line |
| [resolve-error](examples/resolve-error.ts) | why does nothing run, with no browser error? | `creation FAILED [lazy, resolve]` naming the slot with no value; the browser never saw a shader |
| [per-frame-churn](examples/per-frame-churn.ts) | why does the frame creep up and memory grow? | `5 live pipelines are named 'perFrame'`, `5 live resources are named 'scratch'`, leftovers at teardown |

Exit codes of `run.mjs`: `0` ran on a hardware adapter · `1` the scenario threw / a check failed · `2` **not validated** (no WebGPU, software or unverified adapter) · `3` harness error. `node real-gpu/check-examples.mjs` runs the scenarios and checks their output and JSONL.

## Reproduce the evidence

```bash
scripts/setup.sh && scripts/setup-pristine.sh          # TypeGPU at the pinned commit with/without the patch
(cd .work/typegpu && pnpm install --frozen-lockfile --filter "treeshake-test...")   # webpack/rollup/terser for the bundle matrix
scripts/check.sh                                       # mock tests, tsc, lint/format (no GPU, no browser) = what CI runs
node real-gpu/run.mjs                                  # 20 real-device checks (Chrome, CDP)
node real-gpu/run.mjs --call 'window.runViability()' --out v.json                       # 131 checks, 9 scenarios, Chrome
node real-gpu/browser-run.mjs --browser Safari --call 'window.runViability()' --out v.json   # any browser via the OS `open` command
BLOCKS=24 node real-gpu/overhead.mjs && node real-gpu/overhead-stats.mjs real-gpu/results/overhead2-<stamp>.jsonl   # CPU overhead, paired bootstrap CIs
package-test/run.sh                                    # packaging + bundle matrix (vite, esbuild, webpack, rollup), offline
scripts/check-drift.sh                                 # does the patch still apply to upstream main?
```

Every browser run records the environment (browser, adapter, classification, headless/headed). A run that is not on a verified hardware adapter is labelled and exits 2, never counted as real-GPU validation.

## How this repo relates to TypeGPU

It contains no copy of TypeGPU and never touches the original checkout. The hooks live inside TypeGPU's core, so they are stored as a patch; the new module as an overlay.

| Path | What |
|---|---|
| `patches/` | `git` patch against upstream TypeGPU: hook sites in 12 existing files + the package export |
| `overlay/src/` | the instrumentation module → `packages/typegpu/src/core/instrumentation/` |
| `overlay/tests/` | tests → `packages/typegpu/tests/instrumentation/` |
| `consumers/` | reporters, JSONL export/reader |
| `examples/` | the debugging scenarios |
| `real-gpu/` | browser harnesses (Chrome/CDP, any browser), viability suite, overhead benchmark and statistics, recorded results |
| `bench/` | Node (mock device) micro-benchmark |
| `package-test/` | packaging and bundle study against the packed package |
| `experiments/device-tap/` | the device-level alternative and its raw results |

Edit overlay files here; edit existing TypeGPU files in `.work/typegpu`, then `scripts/save-patch.sh`. `scripts/format.sh` applies TypeGPU's own oxfmt/oxlint.
