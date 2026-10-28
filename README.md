# typegpu-instrumentation-poc

An opt-in instrumentation layer for [TypeGPU](https://github.com/software-mansion/TypeGPU). It turns a running TypeGPU program into a stream of plain-data events and a snapshot of what is alive: buffers and textures, bind groups, pipeline compilation with the generated WGSL, shader compiler messages, device errors and teardown. It has no UI and no GPU timing; reporters, test helpers and tools are built on top of the event stream.

## Status

Experimental proof of concept, not published. It needs a TypeGPU build that contains the hook patch in [patches/](patches/) (made against upstream commit `7c853fa3`); every name is `unstable_`.

| Scope | Verdict |
|---|---|
| Experimental opt-in developer tool | **Conditionally ready**: correct on the validated scope, bounded memory, failure-isolated. Use it where the open deviations and blind spots below are acceptable |
| Stable, supported TypeGPU feature | **Not ready**: needs the maintainers' decision on carrying the core patch (0.7–0.83 KB gzip for every user), evidence of demand, platform breadth |
| Always-on production instrumentation | **Not suitable**: 0.4–0.6 µs per tracked object plus 0.2–0.4 µs per event while enabled, no sampling mode |
| Cross-platform | **Partially established**: see [Validation](#validation) |

It does not report GPU execution time, raw WebGPU calls, or objects created outside TypeGPU's own paths; `snapshot.unavailable` lists what is missing.

## Usage

The usage guide is the page in [site/](site/): setup, a minimal example, how an event travels from the hooks to a consumer, options, events, output formats, cleanup and a debugging walkthrough.

```bash
cd site
npm ci
npm start        # http://localhost:4200/instrumentation
```

## Setup

Needs git, Node 24 and pnpm (through `corepack enable`). Chrome is needed only for the real-GPU runs.

```bash
scripts/setup.sh                 # upstream TypeGPU at the pinned commit into .work/typegpu, patch applied, overlay copied in
scripts/setup-pristine.sh        # an unpatched copy: the baseline for the benchmarks and the packaging study
```

`scripts/save-patch.sh` writes changes to existing TypeGPU files in `.work/typegpu` back to `patches/`. `scripts/format.sh` applies TypeGPU's own oxfmt and oxlint.

## Tests and checks

```bash
scripts/check.sh                 # mock-device tests, type check, lint and format check (no GPU, no browser); what CI runs
scripts/test.sh [vitest args]    # only the instrumentation tests
node scripts/check-links.mjs     # relative links in the README resolve
scripts/check-drift.sh           # does the patch still apply to upstream main?
(cd site && npm run check)       # the usage page against overlay/src/types.ts, the option defaults and the recorded output
```

CI: [ci.yml](.github/workflows/ci.yml) runs the mock tests, the drift check, packaging and the usage page checks. [browsers.yml](.github/workflows/browsers.yml) runs the browser matrix.

## Reproduce the evidence

```bash
node real-gpu/run.mjs                                                        # 20 real-device checks (Chrome over CDP)
node real-gpu/run.mjs --call 'window.runViability()' --out v.json            # 133 checks in 10 scenarios
node real-gpu/browser-run.mjs --browser Safari --call 'window.runViability()' --out v.json   # any browser through the OS `open` command
node real-gpu/browser-run.mjs --exe <firefox> --firefox --call 'window.runViability()' --out v.json   # any browser binary; add --query '?forceFallback=1' for a software adapter
node real-gpu/run.mjs --example examples/broken-shader.ts                    # one scenario from examples/; add --jsonl out.jsonl
node real-gpu/check-examples.mjs                                             # run the scenarios and check their output
BLOCKS=24 node real-gpu/overhead.mjs && node real-gpu/overhead-stats.mjs real-gpu/results/overhead2-<stamp>.jsonl   # CPU overhead with paired bootstrap intervals
node real-gpu/sustained.mjs                                                  # 60 s sustained runs
(cd .work/typegpu && pnpm install --frozen-lockfile --filter "treeshake-test..." --filter "@typegpu/noise...")   # bundlers for the next command
package-test/run.sh                                                          # pack the patched package, type-check a consumer against it, bundle in four bundlers
MUTATION_PKG=<copy>/packages/typegpu node mutation/run.mjs $PWD/mutation/mutants.mjs   # mutation testing, on a copy of .work/typegpu (about 15 min)
```

Every browser run records the environment (browser, adapter, headless or headed) and classifies it from two sources: the page's adapter info and the browser's GPU process. A run that is not on a verified hardware adapter is labelled and `run.mjs` exits 2, so it is never counted as real-GPU validation. Recorded results are in `real-gpu/results/`: `scenarios/` (the five debugging scenarios), `control/` (the same without the option), `ci/` (the CI browser matrix), `viability-*.json`, `overhead2-*` and `sustained-*` (benchmarks).

## How it works

```
application ── tgpu.init({ unstable_instrumentation: createInstrumentation(opts) }) ──► root
 typegpu core (always shipped)
   hook sites: root[$internal].instrumentation?.method()  ──►  hub (only bundled if `typegpu/unstable-instrumentation` is imported)
   (the core imports the sink contract as types only)           ├─ weak registry of live resources, bind groups, pipelines
                                                                 ├─ history bounded by count and by estimated bytes, plus pinned failures
                                                                 ├─ FIFO delivery with error isolation
                                                                 └─ one weak device listener per device (uncapturederror, lost)
 consumer ◄── root['~unstable'].instrumentation  (frozen facade: enabled, enable, disable, subscribe, history, getSnapshot, dispose)
```

- **Core side** (the patch): 12 sink methods at 19 call sites in 11 existing source files, plus the package export. Each hook is one property read and a branch, placed after the effect it reports. A fault inside the layer switches the layer off and never reaches the application.
- **Hub side** (`overlay/src/`): everything that costs bytes or memory. An application that does not import the entry contains none of it.
- **Consumers** (`consumers/`): console reporter, text report, JSON Lines export and reader. They only build text.

Alternatives that were evaluated:

| Alternative | Verdict |
|---|---|
| Root-scoped hub with a weak, shared device listener | **kept** (30 abandoned roots used to keep 30 hubs alive through per-hub listeners; fixed by sharing one weak listener per device) |
| One registry per device | rejected: ids, buffers and bind groups belong to a root, so one registry would merge unrelated roots |
| Hub loaded by a dynamic `import()` | rejected: `initFromDevice` is synchronous and early events would be lost |
| Separate entry point, core refers to it by types only | **adopted**: hub strings are absent from non-opting bundles in four bundlers |
| Device-level interception without a patch (`experiments/device-tap`) | not adopted as the primary mechanism: it sees raw WebGPU calls but cannot reproduce TypeGPU's own semantics (trigger, resolve failures, handle identity); a possible second source |
| Activation through a global hook set by DevTools | not built; the natural next step |

## Event contract

Schema version 2: `v: 2`, `seq` (contiguous per root, from 1) and `t` (`performance.now()`) on every event.

| Event | Emitted when |
|---|---|
| `resource-materialized` | a buffer or texture gets its GPU object (lazily, at first use), before any initial value is written |
| `resource-destroyed` | `destroy()` on a tracked resource, once |
| `bind-group-created` | a bind group exists for the root; `entries[].resourceId` is `null` for objects the layer does not track |
| `pipeline-created` | TypeGPU generated WGSL and the creation call returned. With `validation: 'deferred'` (`lazy`, `initSync`) this is **not** proof that the shader compiled; only `initAsync` reports `passed` |
| `pipeline-creation-failed` | no pipeline was produced: `phase: 'resolve'` (before the WebGPU call) or `'create'` (async rejection). The error still reaches the application unchanged |
| `shader-diagnostics` | compiler messages for a pipeline; positions refer to the generated WGSL |
| `device-error` | the device fired `uncapturederror`; one failure can give several, not deduplicated |
| `device-lost` | the device's `lost` promise resolved |
| `root-destroyed` | `root.destroy()`; carries `liveBuffers` and `liveTextures` |

Guarantees (each has a test): listeners run in `seq` order even when they call back into TypeGPU (nested events are queued); delivery is at-most-once; a throwing subscriber never reaches the application or other subscribers; events are frozen; history is bounded by count and bytes and always keeps the newest event; the last 16 creation failures and the `device-lost` event are pinned in `snapshot.retainedFailures`; option mistakes throw from `createInstrumentation()` before a device is requested.

Not promised: the order between asynchronous events beyond "`shader-diagnostics` follows its creation event"; attributing a `device-error` to a pipeline (browsers give text, not an object); events for what the layer cannot see (GPU time, wrapped resources, helper submissions, restored pipelines, samplers, texture views, render bundles, raw WebGPU calls). `disable()` is a blind spot, not a pause: objects created while disabled stay untracked. The one exception is a device loss while disabled, which the next `enable()` announces once.

Compatibility: a breaking change bumps `v`; additive fields do not. Consumers ignore unknown fields and event types, and a reader rejects a `v` it does not know.

## Validation

| Environment | Result |
|---|---|
| Chrome 156, macOS, Apple M3 Pro, hardware adapter (headless and headed) | 133 / 133 viability checks and 20 / 20 real-device checks (130 / 130 in headed and SwiftShader runs made before three checks were added) |
| Safari 26.3, same Mac | 128 / 128, one scenario skipped (no `gc()`); no `device-error` for an invalid render pipeline, only `shader-diagnostics` |
| CI, GitHub-hosted runners, **no physical GPU**: Chrome on Linux (SwiftShader, lavapipe), Windows (WARP) and macOS (paravirtual, SwiftShader); Edge on Windows | 133 / 133 and 20 / 20 in each |
| CI: Firefox on Linux (software) | 131 / 131, one scenario skipped |
| CI: Firefox on Windows and macOS, Safari on a runner | not run: no WebGPU adapter |
| Physical GPUs other than the one Mac, discrete GPUs, Node, React Native | not tested |

Tests: 222 instrumentation tests on a mock device (also against the built package with `TEST_BUILT=1`); the full TypeGPU package suite, 3 177 tests, passes with the patch. Mutation testing (each mutant is a one-line change; killed if a test fails): 161 of 170 mutants killed (94.7 %) on rounds 2 and 3; the survivors are equivalent or memory-only. Mocks are never used as evidence about real WebGPU behaviour.

## Performance

CPU time of the JavaScript calls only, in a real browser against a real device; **no GPU time is measured or claimed**. One machine (Apple M3 Pro, Chrome 156 headless), a fresh browser process per sample, paired bootstrap intervals, rebuilt A/A copies as noise control.

- **Layer disabled:** the patched build is between −2 % and +1.2 % of the unpatched build on four operations; nothing measurable at run time.
- **Enabled, hot paths:** about +5.5 ns per counted dispatch and +8 ns per `buffer.write`; no measurable allocation per hot call.
- **Enabled, event paths:** +852 ns for a buffer create and destroy (2 events), +1 131 ns for a bind group, +3 070 ns (+9 %) for a synchronous pipeline creation.
- **Sustained, 60 s:** 4.6 million events per run; the history stays at 256 events and no growth was found.
- **Bundle:** the hub costs non-users **0 bytes** (four bundlers). The hook sites cost non-users **+0.7–0.8 KB gzip (≈ 1 %)**, which misses the provisional 0.5 KB target. Opting in costs **+3.7–4.2 KB gzip**; importing the entry without using it adds 0.

## Known limits

- Hardware validation is one Mac; other platforms were run on software or virtualised adapters only.
- The core patch is not upstream. The drift job proves only that the hunks still apply, the overlay compiles and the mock tests pass, not that hook placement is still right after an upstream refactor.
- Demand is unvalidated, and the overlap with the Runtime Inspector MCP, WebGPU Inspector and upstream source-map work is only partly characterised.
- Open deviations: `phase: 'resolve'` covers more than WGSL generation; a retry loop on a broken pipeline emits one failure per call and fills the 256-event ring in about 4 s at 60 fps, evicting the events that explain it (`retainedFailures` keeps 16); draws into render-bundle encoders are counted at record time; retained memory can reach about twice `historyMaxBytes`.

## Repository layout

It contains no copy of TypeGPU and never touches another checkout. The hooks live inside TypeGPU's core, so they are stored as a patch; the new module as an overlay.

| Path | What |
|---|---|
| `patches/` | patch against upstream TypeGPU: hook sites in 11 existing source files and the package export |
| `overlay/src/`, `overlay/tests/` | the instrumentation module and its tests (copied into the TypeGPU checkout by `scripts/sync.sh`) |
| `consumers/` | console reporter, text formatting, JSON Lines export and reader |
| `examples/` | five single-file debugging scenarios |
| `site/` | the usage page (Angular) |
| `real-gpu/` | browser harnesses, viability suite, overhead benchmark and statistics, recorded results |
| `bench/` | Node micro-benchmark on a mock device |
| `package-test/` | packaging and bundle study against the packed package; also type-checks the code samples of the usage page |
| `mutation/` | mutation testing |
| `experiments/device-tap/` | the device-level alternative that was evaluated and not adopted |
| `scripts/` | setup, checks, formatting, drift |
