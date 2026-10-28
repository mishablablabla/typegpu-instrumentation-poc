# Mutation testing

Two rounds, to check whether the tests give false confidence: each mutant is one plausible one-line change to the layer, the instrumentation project is run, and a mutant is *killed* if some test fails.

| Round | Against | Mutants | Killed by the tests that existed | Killed after the tests it motivated |
|---|---|---|---|---|
| 1 (`mutants-round1*.mjs`) | the first prototype layer | 176 | 88 (50 %) | 165 (93.8 %) with `overlay/tests/mutation-gaps.test.ts` |
| 2 (`mutants.mjs`, results `results_orig.json` / `results_aug.json`) | the hardened layer | 156 | 89 (57 %) | 149 (95.5 %) with `overlay/tests/mutation-gaps2.test.ts` |

**Re-check on 2026-10-28.** The round-2 figure was reproduced from scratch (`results_round2_e3dda55.json`: 149 killed, 7 survivors N11, N39, N47, N50, N54, N64, N96) on a copy of the tree with the 211 tests that existed then. The committed `results_orig.json` + `results_aug.json` alone give 146 (the re-run files for four mutants had not been committed); the file above is the complete record. After the second audit's fixes the same 156 mutants were run on the new layer with its 219 tests (`results_round2_postfix.json`: 143 killed, 10 survivors, 3 `BAD-FIND`): three mutants targeted code that moved into `validateOptions` / `describeError` and were re-expressed as R01, R02 and R14; N61 and N90 became **equivalent** (the new once-only and never-evict guards make their mutations unreachable); N87 was a *GC-dependent* kill (the test's buffer could be collected, which empties the registry for another reason) and was made deterministic by holding the buffer in test D11 (killed 3 of 3 runs afterwards). N24 (a pending queue that is never reset) makes the test run hang: the harness records the 240 s timeout as killed, which is a genuine detection but a slow one. Current figure for round 2: **147 of 156 killed (94.2 %)**, 9 survivors, all equivalent or memory-only.

Round 3 (`mutants-round3.mjs`, `results_round3.json`) covers the code added by those fixes: **14 of 14 killed** after the tests were strengthened (two first-run survivors, R07 and R08, and R10 pointed at assertions that were too weak; the tests now check the fallback text, the error type of an unprintable message, and the case of a single oversized failure next to `device-lost`). Combined: **161 of 170 (94.7 %)**.

`run.mjs` mutates in place and restores: set `MUTATION_PKG` to a **copy** of `.work/typegpu/packages/typegpu` (`cp -cR .work/typegpu <dir>/typegpu`), never the working checkout; run it from a scratch directory because it writes `last.json` there.

The survivors after round 2 are all equivalent or memory-only (listed in docs/PRODUCTION-READINESS.md). The old suites killed only about half the mutants: that is the false confidence this exercise exists to remove.

`run.mjs` applies one edit from a mutant list to the synced copy under `.work/typegpu/packages/typegpu`, runs `pnpm vitest run tests/instrumentation`, restores the file and records KILLED/SURVIVED. `PKG` now defaults to `.work/typegpu/packages/typegpu` and is overridden with the `MUTATION_PKG` environment variable. Mutants are written against the source of the commit they were run on (round 1: `cb78d72`, round 2: `e3dda55`): `find` strings that no longer match report `BAD-FIND`.
