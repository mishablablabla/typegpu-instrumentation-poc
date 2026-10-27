# typegpu-instrumentation-poc

Proof of concept for a thin, framework-agnostic, opt-in **instrumentation layer for [TypeGPU](https://github.com/software-mansion/TypeGPU)**, meant as the data foundation for future DevTools.

Status: experiment. Nothing here is published, released, or proposed as a stable API.

- Design: [docs/POC-DESIGN.md](docs/POC-DESIGN.md)
- Background research (written against TypeGPU `bec5d554`): [docs/DEVTOOLS-INSTRUMENTATION-RESEARCH.md](docs/DEVTOOLS-INSTRUMENTATION-RESEARCH.md)
- Results: [docs/POC-RESULTS.md](docs/POC-RESULTS.md)
- Remaining production gaps, ranked: [docs/PRODUCTION-GAPS.md](docs/PRODUCTION-GAPS.md)
- Real-GPU validation (Chrome on a hardware adapter, what was and was not verified): [docs/REAL-DEVICE-VALIDATION.md](docs/REAL-DEVICE-VALIDATION.md)

## See the instrumentation output of a TypeGPU scenario

A scenario is an ordinary single-file TypeGPU program: `export default async (root) => { ... }` (see [examples/](examples/)). The harness creates the root with instrumentation on, runs the scenario in your locally installed Chrome on the real GPU, prints every event as one line, and can write a JSONL file.

```bash
scripts/setup.sh                       # once
node real-gpu/run.mjs --example examples/compute-scale.ts --jsonl out.jsonl
```

Output of that command on the author's machine (Apple M3 Pro, Chrome 156; `[scenario]` lines are the program's own `console.log`):

```text
Scenario: examples/compute-scale.ts
Chrome Chrome/156.0.8078.48 (headless)
Adapter (from the page): apple / metal-3, isFallbackAdapter: false
GPU process (from the browser): Google Inc. (Apple) ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Version 26.3 (Build 25D125))
Run classification: real-device: adapter reported non-fallback and the browser GPU process lists a hardware GPU

[001] buffer factor#1 materialized (4 B)
[002] compute pipeline scale#3 created [lazy] resolve 2.80 ms (CPU), create 0.20 ms (CPU), 241 chars of WGSL
[003] buffer data#4 materialized (32 B)
[004] bind group #5 of layout layout#2 (created) { data=#4, factor=#1 }
[005] pipeline #3 shader: no compiler messages
[scenario] result after x3: [3,6,9,12,15,18,21,24]
[scenario] result after x10: [30,60,90,120,150,180,210,240]
[006] buffer data#4 destroyed
1 live resources, 1 pipelines, 1 bind groups
  buffer factor#1: 2 writes, 8 B written
  compute pipeline scale#3: 2 dispatches, 0 draws
  submits via TypeGPU encoders: 2
  not available: gpuExecutionTime, gpuMemoryUsage, wrappedResources, internalResources, rawWebGPUCalls, workgroupCounts, perDispatchBindings, textureMemory
[007] root destroyed (own device: true), still alive: 1 buffers, 0 textures
[008] DEVICE LOST (destroyed): Device was destroyed.

JSONL written to out.jsonl (11 lines)
```

Reading it: `created [lazy]` means the pipeline was created by its first dispatch (a synchronous creation cannot say whether the pipeline is valid; the `shader:` line that follows is the compiler's verdict); the times are CPU `performance.now()` milliseconds (0.1 ms granularity in Chrome), **not** GPU time; `factor` was never destroyed and is reported as still alive at the end. A scenario with a broken shader (`examples/broken-shader.ts`) shows `FAILED to compile [initAsync]` with the compiler error and its position in the generated WGSL.

The JSONL file has one JSON object per line: a `header`, an `environment` record written by the harness, one `event` record per event (exactly what the core emitted, schema in [docs/POC-DESIGN.md](docs/POC-DESIGN.md) and `overlay/src/types.ts`), and a `snapshot` record tagged with the last event it is consistent with. Real samples: [real-gpu/results/example-compute-scale.jsonl](real-gpu/results/example-compute-scale.jsonl), [example-broken-shader.jsonl](real-gpu/results/example-broken-shader.jsonl).

Exit codes: `0` ran on a hardware adapter · `1` the scenario threw · `2` not validated as real GPU (no WebGPU, software or unverified adapter; the output is still printed and labelled) · `3` harness error. The scenario file must be a single file that imports `typegpu`. To run the two bundled scenarios and check their output and JSONL: `node real-gpu/check-examples.mjs`.

Using the data yourself, in any JavaScript runtime: `root['~unstable'].instrumentation` has `subscribe(listener)`, `history()`, `getSnapshot()`. `consumers/consoleReporter.ts` and `consumers/jsonlExport.ts` are the two consumers used above; they only build lines and let the caller choose the sink. This works only with a TypeGPU that has the hook patch applied; an unpatched TypeGPU ignores the option, `instrumentation` is `undefined`, and `consumers/requireInstrumentation.ts` turns that into an explicit error.

## CI

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on push, pull request, manually, and weekly. Job `checks`: `scripts/setup.sh`, then `scripts/check.sh` (mock tests, `tsc`, TypeGPU's own `oxfmt --check` and `oxlint`). Job `upstream-drift`: `scripts/check-drift.sh`, i.e. `git apply --check` of the hook patch against the current tip of upstream `main`; it says the hunks still match, not that the result works. The real-GPU run is not in CI: hosted runners have no usable GPU, so it stays a manual step (`node real-gpu/run.mjs`).

## How this repo relates to TypeGPU

This repo does **not** contain a copy of TypeGPU and the original TypeGPU repository is never touched.
The hooks have to live inside TypeGPU's core (that is the point of the experiment), so the repo stores them as:

| Path | What |
|---|---|
| `patches/` | `git` patches against upstream TypeGPU: the few hook sites in existing files |
| `overlay/src/` | new instrumentation module, copied to `packages/typegpu/src/core/instrumentation/` |
| `overlay/tests/` | tests, copied to `packages/typegpu/tests/instrumentation/` |
| `consumers/` | independent example consumers of the event stream |
| `bench/` | disabled-vs-enabled overhead measurement (Node, mock device) |
| `real-gpu/` | real-device validation: page + Chrome/CDP driver + result files |
| `scripts/` | setup / sync / test helpers |

`scripts/setup.sh` clones upstream TypeGPU at the pinned commit (see `scripts/env.sh`) into the git-ignored `.work/typegpu`, applies the patches, installs, and copies the overlay.

```bash
scripts/setup.sh            # once (needs pnpm 11, Node >= 24, network; or TYPEGPU_UPSTREAM=<local clone>)
scripts/test.sh             # sync overlay + run the instrumentation tests
node real-gpu/run.mjs       # real-GPU run in the locally installed Chrome (exit 2 = NOT validated: no WebGPU / software / unverified)
scripts/check.sh            # what CI runs after setup: mock tests, tsc, lint/format check (no GPU, no browser)
scripts/check-drift.sh      # does the hook patch still apply to upstream TypeGPU main?
scripts/save-patch.sh       # after editing existing files inside .work/typegpu
scripts/format.sh           # TypeGPU's own oxfmt + oxlint on everything this repo adds or patches
scripts/setup-pristine.sh   # two untouched upstream trees (baseline + A/A control) for the benchmark
REPS=9 scripts/bench.sh     # pristine vs patched-disabled vs patched-enabled; then: node bench/summarize.mjs <file>
```

Edit overlay files in this repo (the source of truth); edit existing TypeGPU files in `.work/typegpu`, then run `scripts/save-patch.sh`.
