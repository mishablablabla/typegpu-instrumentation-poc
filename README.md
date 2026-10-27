# typegpu-instrumentation-poc

Proof of concept for a thin, framework-agnostic, opt-in **instrumentation layer for [TypeGPU](https://github.com/software-mansion/TypeGPU)**, meant as the data foundation for future DevTools.

Status: experiment. Nothing here is published, released, or proposed as a stable API.

- Design: [docs/POC-DESIGN.md](docs/POC-DESIGN.md)
- Background research (written against TypeGPU `bec5d554`): [docs/DEVTOOLS-INSTRUMENTATION-RESEARCH.md](docs/DEVTOOLS-INSTRUMENTATION-RESEARCH.md)
- Results: `docs/POC-RESULTS.md` (written at the end of the POC)

## How this repo relates to TypeGPU

This repo does **not** contain a copy of TypeGPU and the original TypeGPU repository is never touched.
The hooks have to live inside TypeGPU's core (that is the point of the experiment), so the repo stores them as:

| Path | What |
|---|---|
| `patches/` | `git` patches against upstream TypeGPU: the few hook sites in existing files |
| `overlay/src/` | new instrumentation module, copied to `packages/typegpu/src/core/instrumentation/` |
| `overlay/tests/` | tests, copied to `packages/typegpu/tests/instrumentation/` |
| `consumers/` | independent example consumers of the event stream |
| `bench/` | disabled-vs-enabled overhead measurement |
| `scripts/` | setup / sync / test helpers |

`scripts/setup.sh` clones upstream TypeGPU at the pinned commit (see `scripts/env.sh`) into the git-ignored `.work/typegpu`, applies the patches, installs, and copies the overlay.

```bash
scripts/setup.sh            # once (needs pnpm 11, Node >= 24, network; or TYPEGPU_UPSTREAM=<local clone>)
scripts/test.sh             # sync overlay + run the instrumentation tests
scripts/save-patch.sh       # after editing existing files inside .work/typegpu
```

Edit overlay files in this repo (the source of truth); edit existing TypeGPU files in `.work/typegpu`, then run `scripts/save-patch.sh`.
