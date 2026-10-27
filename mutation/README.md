# Mutation testing

Two rounds, to check whether the tests give false confidence: each mutant is one plausible one-line change to the layer, the instrumentation project is run, and a mutant is *killed* if some test fails.

| Round | Against | Mutants | Killed by the tests that existed | Killed after the tests it motivated |
|---|---|---|---|---|
| 1 (`mutants-round1*.mjs`) | the first prototype layer | 176 | 88 (50 %) | 165 (93.8 %) with `overlay/tests/mutation-gaps.test.ts` |
| 2 (`mutants.mjs`, results `results_orig.json` / `results_aug.json`) | the hardened layer | 156 | 89 (57 %) | 149 (95.5 %) with `overlay/tests/mutation-gaps2.test.ts` |

The survivors after round 2 are all equivalent or memory-only (listed in docs/PRODUCTION-READINESS.md). The old suites killed only about half the mutants: that is the false confidence this exercise exists to remove.

`run.mjs` applies one edit from a mutant list to the synced copy under `.work/typegpu/packages/typegpu`, runs `pnpm vitest run tests/instrumentation`, restores the file and records KILLED/SURVIVED. The `PKG` path at its top points at the clone the study ran in; edit it for your checkout. Mutants are written against the source of the commit they were run on (round 1: `cb78d72`, round 2: `e3dda55`): `find` strings that no longer match report `BAD-FIND`.
