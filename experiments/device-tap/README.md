# Device-level tap: an alternative architecture, evaluated and not adopted

A prototype that observes WebGPU by patching the instance methods of `GPUDevice`, `GPUQueue`, command encoders and pass encoders, with **no change to TypeGPU at all** (`src/deviceTap.ts`, fully reversible). It was built to answer one question with evidence: could this replace the hook patch? Findings and the decision are in [../docs/ARCHITECTURE-DECISION.md](../docs/ARCHITECTURE-DECISION.md).

These files were produced and run in a throw-away clone, with paths relative to its root (`alt/…`); they are kept as the record of the experiment, not wired into `scripts/`. Raw results: `results/`.
