# typegpu-instrumentation-poc

An opt-in **instrumentation and diagnostics layer for [TypeGPU](https://github.com/software-mansion/TypeGPU)**: a stream of plain-data events (resources, bind groups, pipelines, shader diagnostics, device errors, teardown) plus a snapshot of what is alive, meant as the data foundation for developer tooling. Framework-agnostic, no UI, no GPU timing.

Status: **evaluated for production readiness, not published**. The verdict (one per scope) and its evidence are in [docs/PRODUCTION-READINESS.md](docs/PRODUCTION-READINESS.md). Everything is `unstable_`: see the compatibility policy in [docs/EVENT-CONTRACT.md](docs/EVENT-CONTRACT.md). A developer-facing explanation with recorded and live demonstrations is the Angular page in [site/](site/) (see [below](#documentation-page-angular)).

| Read | |
|---|---|
| [docs/PRODUCTION-READINESS.md](docs/PRODUCTION-READINESS.md) | verdicts per scope, acceptance matrix with evidence, defects found, remaining limits |
| [docs/ECOSYSTEM-RESEARCH.md](docs/ECOSYSTEM-RESEARCH.md) | does this need to exist: existing tools, comparison matrix, Runtime Inspector MCP, recommendation, sources |
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

## Documentation page (Angular)

[site/](site/) is an Angular 22 application with one documentation route, `/instrumentation`, in the visual language of the official TypeGPU documentation (reproduced as plain CSS; the official docs are Astro Starlight, not Angular). It explains the problem, the architecture, the quick start, the event contract, the evidence and the limits, and contains a **recorded-trace explorer** (data from this repository, labelled as recorded) and a **live event feed** (runs small programs in the visitor's browser through the same contract).

```bash
package-test/run.sh            # once: builds and packs the patched typegpu that the live feed bundles (3-4 min, offline)
cd site && npm install            # no lockfile is kept: it would pin the hash of the locally packed typegpu
npm run check                  # fixtures and numbers on the page vs types.ts, quickstart, reports (no browser)
npm start                      # http://localhost:4200/instrumentation
npx ng build --configuration production
```

Every event, trace and the quick start on the page is extracted from repository files by `site/tools/build-data.mjs`, not retyped; `npm run check` fails when the page drifts from `overlay/src/types.ts` or from the type-checked quick start.

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

The same programs without the option (what a developer sees today) were captured in [real-gpu/results/control/](real-gpu/results/control/): `node real-gpu/run.mjs --example examples/broken-shader.ts --call 'window.runExampleControl()' --out out.json` (the file includes the browser's own console messages).

Exit codes of `run.mjs`: `0` ran on a hardware adapter · `1` the scenario threw / a check failed · `2` **not validated** (no WebGPU, software or unverified adapter) · `3` harness error. `node real-gpu/check-examples.mjs` runs the scenarios and checks their output and JSONL.

## Reproduce the evidence

```bash
scripts/setup.sh && scripts/setup-pristine.sh          # TypeGPU at the pinned commit with/without the patch
(cd .work/typegpu && pnpm install --frozen-lockfile --filter "treeshake-test..." --filter "@typegpu/noise...")   # webpack/rollup/terser for the bundle matrix
scripts/check.sh                                       # mock tests, tsc, lint/format (no GPU, no browser) = what CI runs
node real-gpu/run.mjs                                  # 20 real-device checks (Chrome, CDP)
node real-gpu/run.mjs --call 'window.runViability()' --out v.json                       # 130 checks, 9 scenarios, Chrome
node real-gpu/browser-run.mjs --browser Safari --call 'window.runViability()' --out v.json   # any browser via the OS `open` command
node real-gpu/browser-run.mjs --exe <firefox> --firefox --call 'window.runViability()' --out v.json   # Firefox/any binary (CI uses this); add --query '?forceFallback=1' for a software adapter
node real-gpu/ci-cell.mjs --cell local --kind chrome --prebuilt .work/real-gpu-dist   # one cell of the CI browser matrix (.github/workflows/browsers.yml)
BLOCKS=24 node real-gpu/overhead.mjs && node real-gpu/overhead-stats.mjs real-gpu/results/overhead2-<stamp>.jsonl   # CPU overhead, paired bootstrap CIs
package-test/run.sh                                    # packaging + bundle matrix (vite, esbuild, webpack, rollup), offline
scripts/check-drift.sh                                 # does the patch still apply to upstream main?
node scripts/check-links.mjs                           # relative links in README and docs resolve
MUTATION_PKG=<copy>/packages/typegpu node mutation/run.mjs $PWD/mutation/mutants.mjs   # mutation round 2 on a COPY of .work/typegpu (about 15 min)
```

Every browser run records the environment (browser, adapter, classification, headless/headed). A run that is not on a verified hardware adapter is labelled and exits 2, never counted as real-GPU validation.

## How this repo relates to TypeGPU

It contains no copy of TypeGPU and never touches the original checkout. The hooks live inside TypeGPU's core, so they are stored as a patch; the new module as an overlay.

| Path | What |
|---|---|
| `patches/` | `git` patch against upstream TypeGPU: hook sites in 11 existing source files (19 call sites, 12 sink methods) + the package export (12 files in the patch) |
| `overlay/src/` | the instrumentation module → `packages/typegpu/src/core/instrumentation/` |
| `overlay/tests/` | tests → `packages/typegpu/tests/instrumentation/` |
| `consumers/` | reporters, JSONL export/reader |
| `examples/` | the debugging scenarios |
| `real-gpu/` | browser harnesses (Chrome/CDP, any browser), viability suite, overhead benchmark and statistics, recorded results |
| `bench/` | Node (mock device) micro-benchmark |
| `package-test/` | packaging and bundle study against the packed package |
| `site/` | the Angular documentation page and its data pipeline and checks |
| `experiments/device-tap/` | the device-level alternative and its raw results |

Edit overlay files here; edit existing TypeGPU files in `.work/typegpu`, then `scripts/save-patch.sh`. `scripts/format.sh` applies TypeGPU's own oxfmt/oxlint.
