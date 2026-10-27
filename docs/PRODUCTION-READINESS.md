# Production readiness

Date: 2026-10-27. Scope: the opt-in instrumentation layer for TypeGPU (`typegpu/unstable-instrumentation` + the hook patch in 12 core files), as a **developer diagnostics tool**. Evidence labels: **[run]** = a command in this repo produced it (raw data under `real-gpu/results/`, `package-test/results/`, `mutation/`); **[derived]** = follows from reading code, not run; **[not done]** = no evidence exists.

## Verdict: CONDITIONALLY READY

Usable as an **opt-in development and diagnostics feature**, within the constraints below. It is **not** claimed ready as an always-on production default, and **not** claimed ready for any environment not listed in the support matrix.

Why not *PRODUCTION-READY*: one mandatory row is only partly evidenced (C1, browser/GPU breadth), two **provisional** budgets are missed by the measurements (B1 residual, P3 per-event cost), and demand/overlap with existing TypeGPU tooling is unvalidated. Why not *NOT READY*: no correctness, lifecycle or memory problem is known to remain in the supported scope; the defects that independent audits and mutation testing found were fixed with regression tests; the disabled path costs nothing measurable at run time and no hub bytes in a bundle.

**Concrete blockers to PRODUCTION-READY** (each says what evidence would close it):

1. **Breadth.** Validated on one Mac (Apple M3 Pro): Chrome 156 (headless and headed), Safari 26.3, and Chrome with a SwiftShader software adapter. No Windows/Linux, no discrete GPU, no Firefox, no real device reset. *Close with:* `node real-gpu/run.mjs --call 'window.runViability()'` on those machines (the harness records the environment).
2. **Bundle residual for non-users is 0.7–0.8 KB gzip (≈ 1 %), above the provisional 0.5 KB target.** The hub itself costs non-users zero bytes. *Close with:* either accept the residual as the price of the hooks, or move payload construction into the hub (estimated −100…150 B gzip).
3. **Per-event cost is 0.4–0.6 µs per tracked object plus 0.2–0.4 µs per event** (provisional budget "≤ 1 % of the emitting operation" is violated for cheap operations such as buffer or bind-group creation). Fine for a dev tool, unsuitable as an always-on default. *Close with:* a maintainers' decision on the intended use, or a sampling mode.
4. **The core patch is not upstream.** It applies to upstream `main` today (checked at `156b99d`: patch applies, 118 instrumentation tests pass there at that check, `tsc` clean [run]) but nothing guarantees it keeps applying. CI has a job for exactly that; it has **not been run on GitHub** (nothing was pushed).
5. **Blind spots are real and listed**: helper submissions, wrapped GPU objects, restored pipelines, samplers, texture views, render bundles, raw WebGPU calls. A device-level tap would cover most of them (prototype in `experiments/device-tap`), at a cost that rules it out as the primary mechanism ([ARCHITECTURE-DECISION.md](ARCHITECTURE-DECISION.md)).
6. **Demand and overlap are unvalidated.** Whether this duplicates TypeGPU's Runtime Inspector MCP (mechanism unknown to this work: no code of it is in the repo) and whether developers want it were not and cannot be checked from the code.

## Support matrix: environments

| Environment | Mode | Result | Notes |
|---|---|---|---|
| Chrome 156.0.8078.48, macOS 26.3, Apple M3 Pro (`apple`/`metal-3`, Metal), hardware adapter (two-source classification) | headless | **130 / 130** checks, 9 scenarios [run: `viability-final-chrome.json`]; 20 / 20 real-device checks; 5 scenarios checked | the reference environment; GC scenario included |
| same | headed | **130 / 130** [run: `viability-final-chrome-headed.json`] | |
| Chrome 156 with `--use-angle=swiftshader` (software Vulkan, `google`/`swiftshader`, `isFallbackAdapter: true`) | headless | **130 / 130**, classified **SOFTWARE ADAPTER, not real-GPU validation** [run: `viability-software-attempt.json`] | a different implementation path for the event semantics; says nothing about hardware |
| Safari 26.3 (WebKit), same machine | headed | **128 / 128** checks, **1 scenario skipped** (`abandoned-roots`: no `gc()` in Safari) [run: `viability-final-safari.json`] | classified `page-only`: no browser-side GPU report is available without a driver, so it is never called two-source validated. Real differences found: no `device-error` at all for an invalid render pipeline (only `shader-diagnostics`), error text without the identifier, timers throttled in a hidden tab (the harness no longer uses `setTimeout` for waits) |
| Firefox, Windows, Linux, discrete GPUs, other drivers | – | **not tested** | reproducible path: `real-gpu/run.mjs --chrome <path>` or `real-gpu/browser-run.mjs --browser <app>` |
| Node + mock device | – | 211 instrumentation tests; the full TypeGPU package suite (3 166 tests at last run) passes with the patch [run] | mocks are never used as evidence about real WebGPU behaviour |
| Built package (`dist`, `exports`, packed tarball) | – | `TEST_BUILT=1` runs the same 211 tests against `dist` and passes; a sabotage of `dist` makes it fail (the switch really uses it); consumer type-check, import effects and bundles with four bundlers [run: `package-test/`] | |

Minimum runtime: an engine with `WeakRef` (ES2021), `queueMicrotask`, and WebGPU; the layer uses `reportError` where present and `console.error` otherwise. TypeScript consumers need `moduleResolution` that honours `exports` (`bundler`, `node16`, `nodenext`; `node10` cannot resolve any `typegpu/*` subpath either).

## Acceptance matrix with evidence

Rows and thresholds are from [ACCEPTANCE-MATRIX.md](ACCEPTANCE-MATRIX.md), written before the work. **PASS** = threshold met on the evidence; **MISSED** = a provisional budget not met (reported, not argued away); **PARTIAL** = part of the row is evidenced.

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| F1 | Functional correctness on a real GPU | **PASS** (supported scope) | 130/130 in three Chrome environments, 128/128 in Safari; the three views (subscription, console reporter, JSONL) agree in every scenario; counters equal calls made |
| F2 | Event semantics and ordering | **PASS** | [EVENT-CONTRACT.md](EVENT-CONTRACT.md): every promise has a test (table in the document); cross-browser ordering differences are listed as *not promised* |
| F3 | Diagnostic completeness stated honestly | **PASS** | `snapshot.unavailable` (14 entries, frozen) + 5 characterisation tests (`blindspots.test.ts`) that pin each blind spot and fail if a hook is added without updating the contract |
| F4 | Diagnostic value | **PASS** (qualitative) | five scenarios with recorded output and JSONL, each answering a concrete question (`README.md`, `real-gpu/results/scenarios/`); three facts are not obtainable from raw browser errors: the resolve-phase failure (the browser never sees a shader), `shader-diagnostics` in Safari where the device error is missing, and repeated-name / leftover notes |
| P1 | Disabled path CPU | **PASS**, one sub-bound not demonstrated | 24-block A/A-controlled run: disabled vs pristine −0.8 ns (open-pass dispatch), −8 ns / −2 ns on own-encoder dispatch/draw (uncertain), +2.3 ns [−2.2, +3.8] on `buffer.write` — the provisional 3 ns is not *demonstrated* for `buffer.write` (upper bound 3.8) |
| P2 | Enabled hot-path CPU | **PASS** (derived for whole operations) | +5.5 ns [5.3, 5.8] per counted dispatch; +8–14 ns per write (provisional 15 ns); zero allocation per hot call [run, Node GC counts]; whole-operation overhead is derived 0.2–0.6 %, **not directly resolvable** (±1.4 %) |
| P3 | Event-path cost | **MISSED** (provisional budget) | +852 ns per buffer create/destroy (2 events), +1 131 ns per bind group, +3.1 µs per sync pipeline (9 %); dominated by the weak registry (≈ 0.4 µs per tracked object). Subscribers: no-op +0 … +21 ns; console 0.1–0.2 µs; JSONL 0.3–1 µs per event (consumer cost) |
| P4 | Sustained operation | **PASS** (60 s × 2 per configuration) | 4.6 M events per run, history stays 256 events / 88 KB, heap slope ±30 KiB/s with changing sign, throughput not lower; deterministic registry-boundedness test (fails with +53 MiB without the sweep) |
| B1 | Bundle cost for non-users | hub: **PASS (0 bytes)**; residual: **MISSED** (provisional) | hub strings absent in all non-opt-in bundles in four bundlers; residual +0.7–0.8 KB gzip (+2.4–2.9 KB min) vs the 0.5 KB provisional target |
| B2 | Import cost for users | reported | +3.5–3.95 KB gzip; importing without using: +0 |
| M1 | Retention after explicit cleanup | **PASS** | deterministic tests: `dispose()` / borrowed `root.destroy()` remove the device listener and subscribers; owned `root.destroy()` ends the stream at `device-lost` and clears the registry |
| M2 | Retention after abandonment | **PASS** (mock and real device) | 30 abandoned roots → 0 hubs alive after GC on the real device (`abandoned-roots` 2/2, Chrome headless, headed, SwiftShader); mock GC tests; audit ran GC tests 6 × up to 30 rounds without flakiness. Not available in Safari (no `gc()`) |
| M3 | History memory | **PASS** | `historyMaxBytes` (estimated payload, newest always kept), `captureSource: false`, pinned failures within the same bound; the claim is "bounded by an **estimate** of payload bytes", never "bounded heap" |
| M4 | Subscriber lifetime | **PASS** | unsubscribe-in-listener, dispose, enable/disable ×2000 cycles, duplicate subscriptions |
| E1 | Failure isolation | **PASS** | throwing/re-entrant/storming subscribers; internal faults switch the layer off, counted and surfaced once; 4 injected-fault tests |
| E2 | Application errors untouched | **PASS** | identical error (type and message) with and without instrumentation for resolve failures; async rejection identity test |
| A1 | Public API | **PASS** | consumer app type-checked against the packed `.d.ts` under three module resolutions; 11 misuse programs each fail with the expected TS code; runtime misuse (`true`, bad options, non-function listener) throws an actionable error |
| A2 | Version policy | **PASS** | schema `v: 2`, JSONL reader rejects unknown versions (7 tests), policy in the contract |
| K1 | Packaging | **PASS** | 34 recorded checks, 0 failures; one known upstream condition: `skipLibCheck: false` reports 8 diagnostics in upstream's own `.d.ts` (identical without the patch) |
| K2 | Upstream drift | **PASS locally; CI job not run** | `scripts/check-drift-full.sh` on upstream `main` `156b99d`: patch applies, 118 tests + `tsc` pass (at that check) |
| C1 | Environments | **PARTIAL** | see the support matrix |
| T1 | Reproducibility | **PASS** | a fresh `git clone` + `scripts/setup.sh` + `scripts/check.sh` passes in 25 s (offline, local upstream clone); every number names its raw file |
| T2 | Test quality | **PASS** | two mutation rounds: the tests that existed killed 50 % and 57 % of plausible mutants; with the tests they motivated 93.8 % and 95.5 % (156 mutants on the final layer: 149 killed, 7 survivors, all equivalent or memory-only: listed in [mutation/README.md](../mutation/README.md) and below). Regression tests were shown to fail when the bug is reintroduced (D1 listener retention, sweep removal, and the rest by the mutants) |
| D1 | Documentation | **PASS** | README (install, activate, use, troubleshoot), contract, architecture, performance, this document; commands copied from them were run |

## Defects found and fixed in this work

| # | Defect | Found by | Fix | Regression test |
|---|---|---|---|---|
| 1 | Abandoned roots kept their hubs alive through per-hub device listeners (30 of 30 retained) | viability gate | one shared weak listener per device | mock + real device |
| 2 | Hub shipped to every user (+3.1 KB gzip) | bundle measurement | opt-in entry point, type-only core references | four-bundler matrix |
| 3 | WGSL-generation failures (the commonest TGSL error) emitted nothing | audit | `pipeline-creation-failed` with `phase: 'resolve'`, error rethrown unchanged | `defects.test.ts` D3, E2 |
| 4 | Misleading `pipeline-compiled` for a sync creation | viability gate | `pipeline-created` + `validation: 'deferred' \| 'passed'` | contract tests |
| 5 | Listener order wrong under nested events; removed listeners still got the in-flight event; recursion in the bind-group hook | audit | FIFO queue, per-listener `active` flag, hook after the cache store (`WeakMemo` `onMade`) | R1–R4 |
| 6 | Unguarded hooks: a fault in the layer could throw into the application and leave half state | audit | every sink method guarded; first internal error switches the layer off | R9, R10 |
| 7 | History bounded by count only (256 × 500 KB WGSL retains ≈ 121 MB) | audit | byte bound + `captureSource` | contract tests |
| 8 | `dispatch`/`draw` counted before the call was recorded; destroy event before the destroy | audit | hooks moved after the effect | D1, G9, mutants Q01–Q27 |
| 9 | `root-destroyed` not terminal for an owned device; snapshot still listed destroyed resources; double `destroy()` emitted twice | audit + mutation | closing state, registry cleared, once | D11 |
| 10 | Pipeline id changed after a failed-then-successful retry | audit | id names the core | D2 |
| 11 | Texture bound directly in a bind group lost its resource id | audit + mutation | resolve id from the object or its handle | D8 |
| 12 | Same function subscribed twice: one unsubscribe removed both; `historySize: Infinity` threw `Invalid array length`; non-function subscriber failed on every event | mutation + audit | per-subscription records, validated options, `TypeError` | R6, R7, option tests |
| 13 | Device loss never delivered to a root attached after the loss | audit | late delivery | T2 |
| 14 | `FinalizationRegistry` dependence for registry cleanup | design review | deterministic amortised sweep | plateau test (fails without it: +53 MiB) |
| 15 | Silent async failure in `initAsync` (found earlier on the first real run) | real-device run | creation-failed event | async-failure tests |
| 16 | Event payload shared mutable arrays; forged hook calls possible; shared `unavailable` array | audit | deep-frozen events, frozen facade, frozen list | A5, A6 |
| 17 | Harness: the survivor of a scenario was collectable (Safari collected it); Dawn-specific expectation treated as universal | cross-browser run | scenario retains it; browser-dependent facts became observations | viability |
| 18 | Benchmark: byte-identical "A/A"; no counter read-back; batch-size regime (4 000 calls: 9.5 µs instead of 2.4 µs) | methodology audit; control experiments | rebuilt A/A copies, verification, batch ≤ 2 000 | PERFORMANCE §Corrections |

## Mutation testing, final layer

156 mutants (option validation, delivery, history/byte accounting, pinned failures, sweep, pipeline events and ids, terminal teardown, late loss, size estimate, hook order and `try/catch` placement in the patch, consumers): 89 killed by the 167 tests that existed, **149 killed (95.5 %)** with the 39 tests the survivors motivated. The 7 survivors: unsubscribe leaves an inactive entry in an array (memory only), `dispose` keeps its surfaced-error memory (memory only), history arrays never compacted (heap only; the API-visible effect is covered), compaction threshold (equivalent), several `device-lost` events retained (a device is lost once), sweep threshold does not double (about 5× slower, not wrong), and one undocumented size constant. All earlier known bugs (hub retaining the root, per-hub device listener) are killed by the GC tests.

## Architectural decisions and alternatives rejected

[ARCHITECTURE-DECISION.md](ARCHITECTURE-DECISION.md) has the full comparison. In one line each: kept the root-scoped hub with a device-scoped weak listener registry; **adopted** a separate entry point (0 hub bytes for non-users); **rejected** loading the hub with dynamic `import()` (root construction is synchronous: early events would be lost); **rejected** device-level interception as a replacement (it cannot see TypeGPU semantics and costs ≈ 4 µs per encoder) and **recommended it as a complement**; **not built**: activation through a global hook for tools.

## Remaining limitations and unresolved risks

- The six blockers above.
- `disable()` is a blind spot, not a pause (objects created meanwhile stay untracked); documented and tested.
- `origin: 'adopted'` can also appear for a bind group another root created and a snapshot cached; `bind-group-created.label` is the layout's name while `snapshot.bindGroups[].label` is the group's own (null): both documented in the contract, unchanged.
- Several roots on one device each report the same `device-error`; a `device-error` cannot be attributed to a pipeline from the browser's message alone (labels are not unique: identical WGSL returns the first module and its label).
- The registry's memory is bounded by V8's collection cadence (an uncollected object keeps its record): in a no-GC-pressure loop it plateaus at tens of MiB (measured 35–42 MiB at 200 k+ dropped buffers) — comparable to the objects it tracks, bounded, but not small.
- Performance numbers: one machine, one browser, synthetic workloads, 60 s sustained runs; whole-operation overhead is derived, not directly measurable below ±1.4 %. Safari timing was not measured.
- Not exercised on any real device: GPU reset (`device-lost` with a reason other than `destroyed` is simulated only), memory-pressure loss, multi-GPU systems.
- CI workflows (`checks`, `upstream-drift`, `packaging`) are written but have never run on GitHub; the real-GPU suites are manual by design (hosted runners have no GPU).
- Everything is `unstable_`: names, the entry point name, option shapes and event schema may change (policy in the contract).

## What this document does not claim

No GPU execution time or GPU-side behaviour; no universal WebGPU coverage; no "memory-safe", "zero overhead" or "fully supported" in any unqualified sense — the scoped statements above are what the evidence supports: zero **hub bytes** in non-opting bundles (four bundlers), **no measurable** run-time difference for the disabled path on four operations (A/A-controlled, one machine), history **bounded by an estimated payload size**, registry **bounded by V8's collection cadence**.

## Reproduce

See [README.md](../README.md) §Reproduce the evidence. The shortest end-to-end check from a fresh clone: `scripts/setup.sh && scripts/check.sh` (about 25 s offline once dependencies are cached), then `node real-gpu/run.mjs --call 'window.runViability()'` on a machine with Chrome.
