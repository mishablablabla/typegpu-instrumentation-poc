# Index of raw results

Every file is raw output of a command in the repo README; nothing is hand-edited. Which ones the documents rely on:

| File(s) | What | Used by |
|---|---|---|
| `overhead2-2026-10-27T17-33-05-921Z.jsonl` (+ `.stats.md/.json`) | 24 blocks × 9 configurations, 216 browser processes, **before** the emission rewrite. Its `dispatch/draw (own encoder)` rows used batch 4000 and are **discarded** (see PERFORMANCE.md §Corrections 7); every other row is used | PERFORMANCE §1, §2 |
| `overhead2-2026-10-27T19-27-59-597Z.jsonl` (+ stats) | 12 blocks × 5 configurations, **after** the emission rewrite | PERFORMANCE §1 (write), §2 |
| `overhead2-2026-10-27T20-00-10-860Z.jsonl` (+ stats) | 24 blocks × 9 configurations, encoder operations only, corrected batch 2000 | PERFORMANCE §1 |
| `overhead2-2026-10-27T19-55-21…19-59-17*.jsonl` | the cross-origin-isolation control and the batch-size study (3 blocks each, pristine only; batch 500 … 8000) | PERFORMANCE §Corrections 7 |
| `overhead2-2026-10-27T17-28-49-146Z.jsonl` | smoke run (2 blocks) that exposed a bug in the row format; not used for any number | – |
| `sustained-2026-10-27T19-46-46-777Z.jsonl` | 60 s sustained runs, 4 configurations × 2 | PERFORMANCE §3 |
| `viability-final-chrome.json`, `viability-final-chrome-headed.json`, `viability-software-attempt.json`, `viability-final-safari.json` | the final 130 / 130 / 130 / 128 checks per environment, each with its `environment` record | PRODUCTION-READINESS environments |
| `scenarios/` | recorded output and JSONL of the five debugging scenarios | README, check-examples |
| `2026-10-27T14-…`, `T15-…`, `T16-…`, `T17-08-…`, `T20-33-…` | the 20-check suite (earlier and final runs) | REAL-DEVICE-VALIDATION |
| `overhead-2026-10-27T16-*.jsonl`, `overhead-run1-small-batches.jsonl`, `bundle-size.json`, `viability-1…3`, `viability-final.json`, `viability-chrome-stage2.json`, `viability-safari.json`, `baseline-viability-*.json` | earlier milestones and intermediate validation runs (history; superseded where PERFORMANCE.md says so) | VIABILITY-REPORT, history |
