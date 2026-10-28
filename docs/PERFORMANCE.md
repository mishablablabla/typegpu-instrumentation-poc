# Performance: CPU overhead, memory, bundle cost

All numbers are **CPU time of the JavaScript calls** (encoding and submitting), measured in a real browser against a real device. **No GPU execution time is measured or claimed anywhere**: the queue is drained between samples, outside the timed region. Raw data (one JSON line per browser process) and the statistics output are committed under `real-gpu/results/`; every number below names its file. One machine, one browser: Apple M3 Pro, macOS 26.3, Chrome 156 headless, hardware adapter (see [REAL-DEVICE-VALIDATION.md](REAL-DEVICE-VALIDATION.md) for how that is established). The user's own Chrome 155 was open and idle in the background (a possible interference source; the per-process CPU probe flagged no process as disturbed; this detail is from the run notes, the raw rows do not record it).

**Provenance of each table** (raw rows carry no source hash, so the hub that produced a result is inferred from timestamps and `git log`): §1 comes from run `T17-33-05` (hub before the emission rewrite; hot-path code is unchanged by it, so it still applies) and `T20-00-10` (current hub). §2 "before" is `T17-33-05`, "after" is `T19-27-59` (12 blocks, **no pristine configurations, so no A/A band**; its "above noise" verdicts mean only "interval excludes zero"). §3 and §4 are current. Hub fixes made after these runs (2026-10-28: total error stringification, `device-lost` retention, once-only `root-destroyed`, eager option validation) touch only failure paths and attach time, not the hot paths or the emission path; the hot-path rerun in [Re-check on the current hub](#re-check-on-the-current-hub) confirms that for the dispatch and write costs.

## Method

- **Unit of replication = a fresh Chrome process.** Each process runs one configuration: 7 operations × 60 batch samples after 8 warm-up batches, then forces a garbage collection before timing each operation. Batch sizes are chosen per operation (below) so one batch takes milliseconds.
- **Timer.** The page is served cross-origin isolated, which makes `performance.now()` tick at 5 µs instead of 0.1 ms (measured per run: `timer.tickMs`). A control run without isolation gives the same costs (9.4 µs vs 9.5 µs for the batch-4000 case below), so isolation does not change what is measured.
- **Configurations** (9, [real-gpu/overhead.mjs](../real-gpu/overhead.mjs)): `pristine` (unpatched upstream), `pristine-b`, `pristine-c` (the same unpatched code **rebuilt** with different page padding: the A/A noise band, they differ in bundle layout and hash, not in logic), `disabled` (patched, option not passed), `enabled-h0` (history 0, no subscriber), `enabled` (default history, no subscriber), `enabled-noop`, `enabled-console` (the console reporter writing to a counting stub), `enabled-jsonl` (the JSONL exporter in memory).
- **Blocks.** One block runs every configuration once, in a freshly randomised seeded order; 24 blocks = 216 processes per run.
- **Statistic.** Per process the 10 % trimmed mean of its 60 samples; per block a paired ratio and difference between two configurations; the estimate is the median of those, the interval a 10 000-resample bootstrap over blocks (95 %, percentile). [real-gpu/overhead-stats.mjs](../real-gpu/overhead-stats.mjs).
- **Vocabulary.** *Above noise*: the interval excludes zero and lies outside the A/A band. *Uncertain*: it includes zero. *Inside the A/A band*: it excludes zero but cannot be separated from build-to-build bias. Budgets are the **provisional** ones of [ACCEPTANCE-MATRIX.md](ACCEPTANCE-MATRIX.md).
- **Verification inside the run.** The open-pass dispatch row is verified against its counter (it must advance by exactly batch × samples); the cold operations check that at least the expected number of events arrived; for `buffer.write` and the own-encoder rows the harness sets `verified = true` without a read-back (`real-gpu/bench-page/main.ts`), so those rows rely on the dispatch/event checks of the same process, not on their own counter. (An earlier version of this benchmark could silently run with the layer doing nothing.)

## 1. Hot paths: what every counted call costs [`overhead2-2026-10-27T17-33-05-921Z`, 24 blocks]

| Operation (batch) | pristine | disabled vs pristine (95 % CI) | enabled vs disabled (95 % CI) | A/A band | Verdict |
|---|---|---|---|---|---|
| dispatch, open pass (100 000) | 38.9 ns | **−0.8 ns** [−1.1, −0.5] (−2.0 %) | **+5.5 ns** [+5.3, +5.8] (+14.4 %) | −0.2 … +0.6 ns | enabled: **above noise**, ≪ budget (15 ns); disabled: **faster than pristine and outside the A/A band** (a code-structure effect, see below), so it is not "within A/A"; within P1 (≤ 3 ns) |
| `buffer.write` (100 000) | 189.9 ns | +2.3 ns [−2.2, +3.8] | +8.2 ns [+3.5, +11.2] (+4.3 %) | −3.0 … +3.8 ns | enabled: measurable but inside the A/A band (not separable from build-to-build bias); disabled: uncertain, upper bound 3.8 ns **exceeds the provisional 3 ns** |
| dispatch, own encoder (2 000) [`…T20-00-10-860Z`] | 2 429 ns | −8 ns [−22, +8] (−0.3 %) | +8.5 ns [−14, +33] (+0.4 %) | −24 … +36 ns | **uncertain** both ways; resolvable only to about ±1.4 % |
| draw, own encoder (2 000) [`…T20-00-10-860Z`] | 2 766 ns | −2 ns [−21, +25] | +10 ns [−38, +39] (+0.4 %) | −36 … +44 ns | **uncertain** |

What this supports:

- **Disabled path.** Not importing the entry costs nothing measurable at run time: on the four operations the patched-but-disabled build is between −2 % and +1.2 % of the unpatched build. On three of them (`buffer.write`, own-encoder dispatch and draw) the interval is inside the noise of identically-built copies. On the open-pass dispatch the build is 0.8 ns [0.5, 1.1] **faster** than pristine, outside the A/A band; the explanation offered (the patch restructures `unwrap()` into a hook-free fast path) is a hypothesis: no build isolating that change was measured. The only budget it does not **demonstrate** is the provisional 3 ns on `buffer.write` (upper CI bound 3.8 ns).
- **Enabled hot path.** One counter hook costs ≈ 5.0–5.5 ns per dispatch (three runs) and ≈ 8 ns per write (+8.2 [3.5, 11.2] in the 24-block run, +7.7 [6.1, 10.4] in the final-hub rerun; one intermediate 12-block run without A/A gave +13.5 [9.3, 16.6] and was not reproduced, so the largest bound seen exceeds the provisional 15 ns; see [Re-check](#re-check-on-the-current-hub)). Against a whole own-encoder dispatch (2.4 µs) that is 0.2–0.6 % **for one hook**; the own-encoder path runs at least two hooks (`dispatched` and `submitted`; `submitted` was never isolated), so the derived figure is about 0.45–1.2 %. All of these are inside what the whole-operation measurements can resolve (±1.4 %, ±35 ns), so the whole-operation overhead is *derived* (hooks per call × measured ns per hook), not directly measured.
- **No measurable allocation per hot call** (Node, mock device, minor-GC counts per 200 000 calls, enabled vs disabled): the committed runs (`bench/results/`) show the same GC counts for both (24 vs 24 own-encoder dispatch, 1 vs 1 open pass, 2 vs 2 write) and a heap difference of +32 bytes per 200 000 calls on the open pass and the write; events emitted during ≈ 3 million counted calls: 6. **These runs predate the final hub** (first design, 2026-10-27 15:30–16:02) and this is a Node mock-device claim, not a browser measurement; an earlier version of this text quoted "25 vs 24" and "+16 B / +1 KB", which are in no committed file.
- Subscribers do not change hot-path cost (no-op, console, JSONL: point estimates within ±0.4 ns on the open-pass dispatch, intervals up to ±0.9 ns): hot paths emit no events.

## 2. Event paths: what an emitted event costs [pre-optimisation: `…T17-33-05-921Z` (24 blocks); post: `…T19-27-59-597Z` (12 blocks)]

| Operation (events per call) | disabled | enabled − disabled, before → after the emission rewrite | per event (= delta ÷ events, a division) | JSONL vs no-op subscriber (24-block run) | console reporter vs no-op (24-block run) |
|---|---|---|---|---|---|
| buffer create + unwrap + destroy (2) | 730 ns | +1 059 ns [1 053, 1 072] → **+852 ns** [836, 865] | ≈ 425 ns | +343 ns [323, 361] | +137 ns [121, 158] |
| bind group create + unwrap (1) | 1 092 ns | +1 190 ns [1 165, 1 197] → **+1 131 ns** [1 118, 1 156] | ≈ 1 130 ns | +967 ns [943, 974] | +217 ns [206, 231] |
| pipeline create, sync (1 + async diagnostics) | 33.4 µs | +3 359 ns [3 271, 3 589] → **+3 070 ns** [2 792, 3 401] (+9 %) | ≈ 3 µs | +2 583 ns (WGSL stringify) | +109 ns [−193, 276] (uncertain) |

- **The layer's per-event cost is dominated by the weak registry, not by event construction.** This is a model, not a measurement: primitive costs from a Node microbenchmark (`bench/primitives.mjs`; its output was not committed, so the figures are not independently reproducible from the repo until it is re-run): `new WeakRef` 128 ns + `WeakMap.set` 194 ns + `Map.set` 85 ns ≈ 400 ns per tracked object, versus ≈ 100 ns for building, freezing and sizing the event. The emission rewrite (no object copy, allocation-free freeze/size, deterministic sweep instead of a `FinalizationRegistry`) bought 20 % on buffers and 5 % on bind groups; the rest is the price of being able to answer "what is alive?".
- **The provisional budget "event cost ≤ 1 % of the emitting operation" is violated** for the cheapest emitting operations (buffer create + destroy: +117 % [+123 % on the 12-block run's own baseline]; bind group: +104 %; the percentages divide a 12-block delta by the 24-block baseline). Re-stated honestly: **≈ 0.4–0.6 µs per tracked object plus ≈ 0.2–0.4 µs per event.** An application that creates 1 000 tracked objects per frame pays ≈ 1 ms per frame (6 % of 16.6 ms) while the layer is on. That is acceptable for a development tool and the reason it is opt-in and `disable()`-able; it is not acceptable as an always-on production default. Whether the budget itself was reasonable is a maintainers' decision; it was a starting point, not a measurement.
- Serialisation is a consumer's cost and is paid only by that consumer. **What was measured is formatting only**: the console reporter wrote to a counting stub and the JSONL exporter to an in-memory array. Real console I/O (with DevTools open or closed), files and network sinks were **not** measured. JSONL ≈ 0.3–1 µs per event (+2.6 µs for a pipeline event carrying its WGSL).
- The cost of a no-op subscriber is small but not shown to be zero: +16.5 ns [3.8, 34.4] on the buffer operation in the 12-block run, +143 ns [21, 365] on pipeline creation in the 24-block run, other rows uncertain. An earlier text said "+0 … +21 ns, statistically indistinguishable"; that was too strong.
- Pipeline creation is timed **synchronously** and for **compute** pipelines only: the asynchronous `getCompilationInfo()` work arrives after the timed region and is not in the number, and the interval depends on the statistic (trimmed mean +3.07 µs; plain median +2.6 µs [2.3, 2.8]; timer tick 5 µs over 20 calls per sample), so quote it as about 2.6–3.4 µs.

## 3. Sustained use: does it grow or slow down? [`sustained-2026-10-27T19-46-46-777Z`]

60 s per run, 2 runs per configuration, fresh process, `--enable-precise-memory-info`, heap read once per second after a forced collection, trend measured after a 15 s warm-up. The loop creates and destroys a buffer, creates a bind group, dispatches, and every 25th iteration creates a pipeline.

| Config | events emitted per run | history at end | heap slope after warm-up (KiB/s, per run) | ops/s median (per run) |
|---|---|---|---|---|
| disabled | 0 | – | +4.7, +4.5 | 71 747, 72 888 |
| enabled | ≈ 4.6 M | 256 events / 88 KB | −10.2, +27.1 | 75 110, 75 350 |
| enabled, no-op subscriber | ≈ 4.6 M | 256 / 88 KB | +16.8, −9.1 | 75 290, 75 410 |
| enabled, history 0 | ≈ 4.6 M | 0 | −1.4, −3.8 | 75 711, 75 350 |

No systematic growth with the layer on (slopes change sign between identical runs, per-run standard errors 11–14 KiB/s, ±30 KiB/s ≈ ±1.8 MiB per minute against 4.6 million events; two runs cannot support a finer trend claim); the history stays at its bound; throughput is not lower with the layer on (it is ~4 % *higher*, which is an artefact of the loop awaiting queue completion, not a CPU benefit). With the layer **off** the slope is small but consistently positive (+4.7, +4.5 KiB/s ≈ 270 KiB/min), so "no growth" is not claimed for the baseline either. The heap figure is the JS heap (`performance.memory`); GPU and native memory are not measured. The heap oscillates between 3.5 and 8 MiB with the layer on (3.1 MiB off): a bounded sawtooth from the registry (records for objects not yet collected). A deterministic test pins the registry's boundedness ([contract.test.ts](../overlay/tests/contract.test.ts), "forgets collected resources…": 400 000 dropped buffers, growth between 40 000 and 400 000 < 4 MiB; with the sweep disabled the same test measures +53 MiB and fails). **Limit:** 60 s, 2 runs; no multi-hour run, no real application.

## 4. Bundle and import cost [`package-test/results/bundle-matrix.md`, `bundle-markers.txt`]

Packed package consumed from node_modules (not the repo source), one configuration per bundler, minified, gzip level 9. A = app without the entry, B = the same app with `createInstrumentation()`, D = imports the entry but never uses the binding.

| Bundler | non-users: residual of the hook sites (A patched − A pristine), min / gzip / brotli | users: B − A, min / gzip / brotli | D − A (import unused) |
|---|---|---|---|
| Vite 8 (rolldown) | +2 947 / **+825** / +612 | +15 766 / +4 169 / +3 680 | +0 |
| esbuild 0.27 | +2 433 / +726 / +448 | +11 704 / +3 743 / +3 268 | +0 |
| webpack 5 | +2 475 / +706 / +678 | +12 003 / +3 832 / +3 250 | +0 |
| rollup 4 + terser | +2 419 / +751 / +522 | +11 940 / +3 747 / +3 265 | +0 |

- **Hub bytes for non-users: zero.** None of the hub's strings (`pipeline-created`, `pipeline-creation-failed`, `uncapturederror`, `FinalizationRegistry`, `resource-materialized`, …) occurs in any bundle that does not use the entry, in any of the four bundlers; importing the entry without using it also adds nothing (`sideEffects: false`). They all occur in the opt-in bundles. Bundles are deterministic (rebuilds are byte-identical).
- **Residual cost of the hook sites: 0.7–0.8 KB gzip (≈ 1 % of the bundle), 2.4–2.9 KB minified.** This **misses the provisional target of ≤ 0.5 KB gzip**. It is the hook sites in the core (12 sink methods at 19 call sites in the patch; 11 methods at 17 sites survive into a bundle): mostly the payload construction at the four pipeline-creation sites and two failure branches. It could be reduced by passing raw values and building payloads in the hub (estimated 100–150 B gzip) and was not, for readability.
- **Cost for users: +3.7 to +4.2 KB gzip** (B − A; the entry: hub, device-event registry, size estimate). The matrix's other estimate, Cb − C ("hub fixed cost", an app that already uses a hook-bearing core), is 3.7–4.1 KB for three bundlers and **+5.2 KB gzip for webpack**, which is outside the quoted range. The matrix was re-run on 2026-10-28 after the audit fixes (they added about 190–220 bytes gzip to the entry: option validation and total error stringification; the earlier run measured +3.5 to +3.95 KB); the non-user residual is unchanged because the fixes are in the hub, not in the core hooks.
- Versions are exact in `bundle-matrix.json`: Vite 8.0.5 (rolldown, oxc minify), esbuild 0.27.5, webpack 5.104.1 (production, terser), rollup 4.60.1 + node-resolve + terser 5.44.1. The "hub strings absent" check is a substring test, so it is the byte deltas (D − A = +0 gzip; +83/+84 bytes raw in webpack and rollup, −119 brotli in Vite) that carry the weight.
- The previous design (hub imported by `init.ts`) cost every user +3.1 KB gzip (+3.8 %); that is gone. Whether even the 0.7–0.8 KB residual is acceptable for a non-opted-in user is the maintainers' call; it is stated, not argued away.

## Re-check on the current hub

A narrow rerun on the **final hub** (after the 2026-10-28 audit fixes), with A/A copies: `BLOCKS=12 CONFIGS=pristine,pristine-b,pristine-c,disabled,enabled OPS='dispatch (open pass),buffer.write,buffer create+destroy' node real-gpu/overhead.mjs`, then `node real-gpu/overhead-stats.mjs <file>`. Raw rows and statistics: `real-gpu/results/overhead2-2026-10-28T00-22-53-276Z.jsonl` (+ `.stats.md`). Chrome 156.0.8078.49 headless, hardware adapter (apple / metal-3), `crossOriginIsolated` (timer tick 5 µs), 12 blocks × 5 configurations = 60 fresh processes, 60 samples per operation per process, the CPU-speed probe flagged 0 processes, the machine was otherwise idle (the documentation dev server and the in-app browser were not interacted with). Same statistic and bootstrap as above.

| Operation | disabled vs pristine (95 % CI) | enabled vs disabled (95 % CI) | A/A band (rebuilt copies) |
|---|---|---|---|
| dispatch, open pass (batch 100 000) | −0.9 ns [−1.2, −0.2] (−2.3 %) | **+5.0 ns** [+4.7, +5.3] (+13.3 %) | −0.3 … +1.0 ns |
| `buffer.write` (batch 100 000) | +1.9 ns [−0.3, +6.3] (uncertain) | **+7.7 ns** [+6.1, +10.4] (+4.0 %) | −3.4 … +5.5 ns |
| buffer create + unwrap + destroy (2 events) | +4.3 ns [−5.6, +13.0] (uncertain) | **+865 ns** [+850, +887] (+124.9 %) | −16 … +20 ns |

What this changes: (1) the per-dispatch hook cost is confirmed on the final hub (+5.0 against +5.5 and +5.3 earlier). (2) The per-write cost in this run is +7.7 ns with an upper bound of 10.4 ns, inside the provisional 15 ns; the earlier 12-block run (+13.5 ns [9.3, 16.6], no A/A) was not reproduced, so **8 ns is the best estimate and 17 ns the largest bound seen**; quote both. (3) The disabled path: the open-pass dispatch is again about 1 ns faster than unpatched; whether that is outside the A/A band differs between runs (outside in the 24-block run, inside here), so it is stated as "under 1 ns faster, not separable from build-to-build bias at 12 blocks". For `buffer.write` the disabled upper bound is **+6.3 ns** at 12 blocks (it was +3.8 ns at 24 blocks), so the provisional 3 ns for the disabled write path remains **not demonstrated**. (4) Event-path cost for buffers (+865 ns) is the same as before the fixes (+852 ns): the fixes did not touch it. Not re-run: bind groups, pipelines, own-encoder rows, console and JSONL consumers, sustained runs, bundle sizes (the bundle matrix was re-run; see §4).

## Corrections to earlier reports

An independent audit of the earlier methodology ([viability gate](VIABILITY-REPORT.md) §6–7) found, and this document supersedes:

1. **The old A/A control was byte-identical code** (same file hash), so it measured process noise only, not build-layout bias. Replaced by rebuilt copies with different padding, and by paired block statistics with confidence intervals.
2. **"Disabled is indistinguishable from pristine" was too strong.** For the open-pass dispatch, disabled is *faster* than pristine (−0.8 ns [−1.1, −0.5], outside the A/A CI) because the patch restructures `unwrap()`; the right contrast for the hook's own cost is *enabled vs disabled on the same bundle* (+5.5 ns).
3. **"+4 ns per dispatch" and "+10 ns per write" were quoted against pristine** and from one run; the same-bundle contrasts are +5.5 ns and +8–14 ns.
4. **Whole-operation overhead "within noise" was vacuous**: the interval on a 2.5 µs operation is ±1.4 % (±35 ns), which cannot exclude overhead 5× the measured hook cost. It is now stated as derived, not measured.
5. **The old browser benchmark did not read back its counters**; the new one verifies them (and aborts otherwise).
6. **A "+3.4 %" bundle figure** appeared in the earlier summaries with no source; the recomputed deltas (+3 146 / +3 168 bytes gzip, +3.8 %) were stable. Superseded entirely by §4.
7. **New in this study: a batch-size regime.** Own-encoder dispatches in batches of ≥ 4 000 calls cost 9.5 µs per call instead of 2.4 µs (500 → 2 350 ns, 2 000 → 2 445 ns, 4 000 → 9 491 ns, 8 000 → 14 724 ns) — a flush-threshold effect, not isolation. An intermediate run of this benchmark used 4 000 and its own-encoder numbers were discarded; the table above uses 2 000. Any CPU benchmark of per-call WebGPU cost should state its batch size.

## Not measured, so not claimed

GPU execution time; another browser's or another GPU's overhead (the Safari run covers correctness, not timing: its timer is coarse); a real application's frame; hours-long runs; the cost on a device under memory pressure; `captureSource: false` savings; multi-root interplay; real console, file or network reporter I/O; render-pipeline creation overhead; asynchronous compile-diagnostic cost; the `submitted()` hook in isolation; heap growth of the baseline beyond 60 s.

## Reproduce

```bash
scripts/setup.sh && scripts/setup-pristine.sh
BLOCKS=24 node real-gpu/overhead.mjs                     # ~2 h; OPS=… CONFIGS=… BATCHES='{"dispatch (own encoder)":2000}' narrow it
node real-gpu/overhead-stats.mjs real-gpu/results/overhead2-<stamp>.jsonl
REPS=2 SECONDS=60 node real-gpu/sustained.mjs
package-test/run.sh
```

The machine should be otherwise idle; the per-process CPU-speed probe flags disturbed processes and the statistics script reports them.
