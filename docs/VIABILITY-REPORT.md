# Viability report: is this a usable diagnostic tool?

> **Superseded in parts.** This is the viability gate as written on 2026-10-27, before the production-readiness work. Its measurements are kept as history. Corrected or replaced since: §6 (the A/A control was byte-identical code and "disabled is indistinguishable from pristine" does not hold for the open-pass dispatch; see [PERFORMANCE.md](PERFORMANCE.md) §Corrections), §7 (the hub is no longer shipped to non-users), and the event names `pipeline-compiled` / `pipeline-compile-failed` (now `pipeline-created` / `pipeline-creation-failed`, [EVENT-CONTRACT.md](EVENT-CONTRACT.md)). Current verdict: [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md).


Date: 2026-10-27. Evidence labels: **[measured]** = a command in this repo produced it (raw data in `real-gpu/results/`); **[derived]** = follows from reading code, not run; **[not tested]** = nothing exercised it.

## 1. Conclusion (up front)

**Continue.** On a real GPU the event stream was correct in every scenario I could trigger (131 checks, nine scenarios, three views of the stream agreeing), CPU overhead is negligible, and the one real defect the gate found (a memory retention) was fixed with a small change and a regression test. The design does **not** need to be thrown away. Two things need to change before it is a product, and both concern *integration*, not the event model:

1. **It costs every user of TypeGPU about +3.1 KB gzip (+3.8 %), whether or not they use it** [measured], because the hub is imported statically. It must become loadable on demand.
2. **It lives in a ~250-line patch of TypeGPU internals** [measured]. It applies cleanly today (also to upstream `main`, 25 commits ahead), but it only becomes a product if upstream takes the hooks, or this stays a maintained fork.

What would have turned this into *stop*: wrong, duplicated or missing events; CPU overhead above a few percent on realistic operations; or retention that cannot be fixed without redesign. None occurred. What would have meant *redesign*: a defect in the event model itself. One naming problem exists (§4, D2) but it is a rename, not a redesign.

## 2. What was tested, and where

| | |
|---|---|
| Hardware | MacBook, Apple M3 Pro, macOS 26.3 (arm64) |
| Browser | Google Chrome 156.0.8078.48, `--headless=new`, throwaway profile, `--js-flags=--expose-gc` |
| Adapter | page: `apple` / `metal-3`, `isFallbackAdapter: false`; browser GPU process: `ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro)`. Classified `hardware-adapter` by `real-gpu/classify.ts`; software and unverified runs are refused (exit 2) |
| Code | upstream TypeGPU `7c853fa3` + `patches/0001-instrumentation-hooks.patch` (10 files, +210/−37) + `overlay/` |
| Not covered | Safari, Firefox, Windows/Linux, discrete GPUs, headed mode, a genuine device reset |

Commands (all in README): `node real-gpu/run.mjs --call 'window.runViability()' --out <file>`, `REPS=9 node real-gpu/overhead.mjs` then `node real-gpu/overhead-summary.mjs <file>`, `node real-gpu/bundle-size.mjs`, `scripts/check.sh`.

## 3. End-to-end event correctness [measured]

Each scenario (`real-gpu/page/viability.ts`) states the events it must produce, derived from the hook sites; every scenario also runs generic invariants and compares three independent views of the same stream: the live subscription, the console reporter's lines, and the JSONL export. Final run: `real-gpu/results/viability-final.json`, 131/131 checks.

| Scenario | Expected (exact sequence unless noted) | Result |
|---|---|---|
| `resources` | materialize ×3 (buffer via write, texture, buffer), destroy ×2 (second `buf.destroy()` silent), `root-destroyed` (1 survivor), `device-lost`; payloads: sizes, usage flags, texture format/size/mips/samples/dimension; write-after-destroy throws and emits nothing | 21/21 |
| `compute-bindgroups` | one lazy compile for 5 dispatches over 2 handles; per-bind-group entry→resource ids (shared `factor` has the same id in both); materialize-before-bind-group; GPU results `[8,16,…]`/`[4,8,…]` read back; counters 5 dispatches / 5 submits (`read()`'s submits are uncounted by design) | 22/22 |
| `render` | lazy render compile, texture materialize, 3 draws over 2 handles, **red pixel read back with raw WebGPU** | 18/18 |
| `explicit-init` | `initSync` then `initAsync` triggers in call order; later dispatch/draw does not recompile; each compile gets diagnostics | 18/18 |
| `sync-failures` | invalid compute and render pipeline via `initSync`: `pipeline-compiled`, compiler **error** whose line number points at the offending line of the generated WGSL, device errors naming the identifier | 19/19 |
| `async-failures` | `initAsync` of invalid compute and render: `GPUPipelineError`, `pipeline-compile-failed` (compute then render), diagnostics, no `pipeline-compiled`, not listed as live | 20/20 |
| `lifecycle` | §5 | 9/9 |
| `abandoned-roots` | §5, D1 | 2/2 (2 failed before the fix) |
| `never-opted-in` | no instrumentation object; results still correct | 2/2 |

Generic invariants checked in every scenario: contiguous `seq`, non-decreasing `t`, no resource materialized or destroyed twice, destroy follows materialize with the same type/label, no pipeline reported twice, WGSL has a stage entry point, bind-group entries refer to resources materialized *earlier*, shared layout ids, diagnostics refer to an earlier pipeline, JSONL events ≡ emitted events, console lines = one per event in order.

**Result of reading the actual consumer output and JSONL by hand:** no duplicated and no missing events in the covered scenarios; counters equal the number of calls made. Example real output (`compute-bindgroups`):

```text
[001] compute pipeline scale#2 created [lazy] resolve 7.80 ms (CPU), create 0.20 ms (CPU), 241 chars of WGSL
[002] buffer data1#3 materialized (32 B)
[003] buffer factor#4 materialized (4 B)
[004] bind group #5 of layout layout#1 (created) { data=#3, factor=#4 }
[005] buffer data2#6 materialized (32 B)
[006] bind group #7 of layout layout#1 (created) { data=#6, factor=#4 }
[007] pipeline #2 shader: no compiler messages
```

**Not triggered, so not claimed:** wrapped `GPUBuffer`/`GPUTexture`, texture views, samplers, query sets, render bundles, `encoder.finish()` submissions, `writeTexture`, `adopted` bind groups, raw WebGPU calls, a device loss with a reason other than `destroyed`. They are listed as unavailable in the snapshot, but none was exercised.

## 4. Defects versus other findings

| # | Finding | Kind | Status |
|---|---|---|---|
| D1 | **Abandoned roots leak their instrumentation.** 30 roots on one device, dropped without `destroy()` (what hot reload does): all 30 hubs, with their event history, survived garbage collection, because each held its own device listener and `lost` reaction. [measured: `viability-3-defect-abandoned-hubs.json`] | Real defect, bounded-memory violation | **Fixed**: one shared, weakly-referencing listener per device (`overlay/src/deviceEvents.ts`). Regression tests fail on the old hub (30 listeners instead of 1) and pass now; the real run passes. Real-device and mock |
| D2 | **A synchronous creation is reported as `pipeline-compiled` even when the shader is invalid**, and the console report printed "compiled" for it. [measured: `sync-failures`] | Misleading payload | Consumer fixed (prints `created` for sync, `compiled` only for async success; regression test). **The event name is still misleading** for anyone reading raw events; recommended rename `pipeline-created` + explicit validity in a redesign pass. Documented on the type |
| D3 | A failed synchronous creation gives **two** `device-error`s (module parse error, then "invalid due to a previous error"); an async failure gives one. [measured] | Browser behaviour, not a defect | Consumers cannot and should not dedupe; documented |
| D4 | My first expectation for `render` had the texture materialize before the compile. The code (`#ownPassDescriptor()` unwraps the pipeline first) and the real output agree on compile first. [measured] | Error in the test expectation, not in the tool | Expectation corrected from the code, not from the output alone |
| D5 | `usage` is a raw numeric flag in events/JSONL (`140`, `76`), not decoded | Usability gap | Not fixed |
| D6 | Pre-existing, from earlier milestones and still true: identical WGSL gives a first-module label in pipeline errors; `submits` counts only `TgpuCommandEncoder.submit()`; labels in snapshots are read live | Known limitations | Documented in earlier reports |

## 5. Lifecycle and bounded history [measured, real device and mock]

| Claim | Real device | Mock tests |
|---|---|---|
| History stays at its bound under sustained generation | 4 000 events with bound 64: history 64, `droppedEvents` 3 936 | 40 000 events with bound 256: history is exactly the last 256 sequence numbers; drops accounted |
| Unsubscribed consumers stop | subscriber B stops at exactly 100 events | 100/100 split |
| Subscribers are independent; a throwing one does not disturb others | A received all events; the throwing C's 4 000 throws were counted | 200/100/200 |
| `disable()` collects nothing and retains no new history | no listener calls, history unchanged, `enabled=false`; `enable()` resumes at the next sequence number (no gap) | yes |
| After `dispose()`: no stale events | the in-flight diagnostics and later resource activity produced none | also device errors and device loss produce nothing |
| Destroyed resources do not produce stale events | write-after-destroy throws, second destroy silent | destroyed-then-collected resources are not counted as leaked |
| Disabled (never opted in) retains nothing | no instrumentation object exists | yes |
| Abandoned roots do not leave instrumentation behind | after the fix: 0 of 30 hubs survive | 0 of 30; one shared listener removed with the last hub |

## 6. Runtime overhead [measured; CPU side only]

Same workload, in a fresh Chrome process per run, against four configurations (`pristine` = upstream without the patch; `pristine-b` = an identical second copy as an **A/A control**; `disabled` = patched, not requested; `enabled` = patched, requested), order rotated, 9 processes per configuration, 8 warm-up batches, 40 timed batches per operation per process. Final run: `real-gpu/results/overhead-2026-10-27T16-09-55-904Z.jsonl` (an earlier run with identical settings, `…16-00-27…`, agrees). The timer is `performance.now()` (0.1 ms steps); batch sizes are chosen so one batch takes several milliseconds, giving 2–5 ns resolution on the lightest operations. The queue is drained between samples **outside** the timed region, so this measures how long the JavaScript calls take, **not GPU execution time**. No GPU timing is claimed anywhere.

Median and p95 over the per-process medians / p95s (ns per operation):

| Operation | pristine median / p95 | A/A (pristine-b) median | disabled median / p95 | enabled median / p95 | pristine spread across processes |
|---|---|---|---|---|---|
| dispatch (own encoder) | 2500 / 2800 | 2500 (0.0 %) | 2450 / 2850 (−2.0 % / +1.8 %) | 2550 / 3000 (+2.0 % / +7.1 %) | 16.0 % |
| dispatch (open pass) | 42 / 46 | 42 (0.0 %) | 40 / 44 (−4.8 % / −4.3 %) | 46 / 50 (+9.5 % / +8.7 %) | 4.8 % |
| draw (own encoder) | 2900 / 3500 | 2900 (0.0 %) | 2950 / 3550 (+1.7 % / +1.4 %) | 2850 / 3600 (−1.7 % / +2.9 %) | 6.9 % |
| buffer.write | 190 / 200 | 196 (+3.2 %) | 198 / 206 (+4.2 % / +3.0 %) | 200 / 210 (+5.3 % / +5.0 %) | 8.4 % |

Reading it honestly:
- **Disabled is indistinguishable from pristine** on every operation: deviations are within the A/A bias and the process-to-process spread (the −4.8 % on a 42 ns operation is 2 ns).
- **Enabled is within noise on whole operations** (encoder + submit ≈ 2.5–2.9 µs: +2 % / −1.7 %). On the lightest paths it costs a few nanoseconds per call: about **+4 ns per dispatch call in an open pass** and **+10 ns per `buffer.write`** (the A/A control itself differs from pristine by +6 ns there, so only about 4 ns of that is above the measurement bias). That is below 0.5 % of a full dispatch.
- Enabled mode allocates nothing per dispatch/draw (counters only); events are emitted on cold paths only [measured earlier on the Node mock: 6 events over ~3 M hot calls].
- Single outlier processes appear (e.g. one `disabled` process with a 128 ns open-pass median); medians are robust to them, and they are in the raw file.

**Limits:** one machine, one browser, one GPU; a synthetic microworkload (tiny dispatches, a 16×16 target), not an application; headless; the real cost of a dispatch is dominated by driver calls, so relative overhead on heavier frames will be smaller, but I did not measure an application. An earlier Node-mock benchmark (`bench/results/`) shows the same picture and is the comparison to use for per-call JavaScript cost without browser noise.

## 7. Bundle-size impact [measured]

Vite, minified, `NODE_ENV=production`, ES lib build; `real-gpu/results/bundle-size.json`.

| Entry | | pristine | patched | delta |
|---|---|---|---|---|
| import and create a root only | raw / gzip / brotli | 325 143 / 82 189 / 67 856 | 336 911 / 85 335 / 70 327 | **+11 768 (+3.6 %) / +3 146 (+3.8 %) / +2 471 (+3.6 %)** |
| small app (buffers, bind group, compute + render) | raw / gzip / brotli | 333 415 / 84 265 / 69 619 | 345 186 / 87 433 / 72 258 | +11 771 (+3.5 %) / +3 168 (+3.8 %) / +2 639 (+3.8 %) |

The hub is present in both bundles even though nothing enables it: `init.ts` imports it statically, so no bundler can drop it. This is the single largest recurring cost of the approach and it falls on users who never opt in. (Fixing D1 added about 0.3 KB gzip: the delta was +2.9 KB gzip before the fix.)

## 8. Remaining limitations and untested assumptions

- Breadth: one browser/GPU/OS. Safari, Firefox, discrete GPUs, other OSes [not tested]. A real device reset [not tested; cannot be provoked here].
- Collection blind spots listed in §3 and in `PRODUCTION-GAPS.md`.
- History is bounded by **count**, not bytes: `pipeline-compiled` carries the full WGSL, so a bound of 256 with large shaders can hold many megabytes [derived; not measured].
- The overhead numbers are for a microworkload, not an application [see §6].
- Event ordering across async events (diagnostics settle after later events; `device-error` arrives before `shader-diagnostics` for the same failure) is observed, not specified.
- The event type name `pipeline-compiled` (D2).
- The patch is still unmerged internals: no maintainer has been asked.
- CI covers mock tests, `tsc`, lint and patch drift only; no CI runs the real-device checks (by decision).

## 9. Decision and next steps

**Continue**, in this order:
1. Make the hub opt-in at bundle level (dynamic import or a build-time gate) and re-measure §7; target 0 bytes for non-users. This removes the only measured cost that hits non-users.
2. Rename `pipeline-compiled` to something that does not claim success (and carry validity explicitly), while the event schema is still `~unstable`.
3. Decide the upstream path (propose the funnels to TypeGPU maintainers) or accept a fork; the patch applies to current upstream `main` today.
4. Repeat `viability` and `overhead` on a second browser and GPU before any wider claim.

## 10. Changed files in this gate

New: `real-gpu/page/viability.ts`, `real-gpu/bench-page/` (`main.ts`, `build.mjs`, `bundle.mjs`, two bundle entries, `index.html`), `real-gpu/overhead.mjs`, `real-gpu/overhead-summary.mjs`, `real-gpu/bundle-size.mjs`, `overlay/src/deviceEvents.ts`, `docs/VIABILITY-REPORT.md`, result files under `real-gpu/results/`. Changed: `overlay/src/hub.ts` (device events moved out), `real-gpu/run.mjs` (generic `--call/--out/--tree/--page/--dist/--skip-build/--ready`), `real-gpu/page/main.ts`, `consumers/textReport.ts`, `overlay/tests/instrumentation.test.ts` and `consumers.test.ts`, `real-gpu/check-examples.mjs`, `README.md`, `scripts/sync.sh`, `scripts/format.sh`. The hook patch itself is unchanged. Nothing was pushed or published.
