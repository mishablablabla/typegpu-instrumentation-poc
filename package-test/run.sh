#!/usr/bin/env bash
# Reproduces the whole packaging / bundle-cost study. Offline: no registry access, no browser, no GPU.
# Prereq (from a fresh clone):  scripts/setup.sh && scripts/setup-pristine.sh
#   plus the bundlers:  (cd .work/typegpu && pnpm install --frozen-lockfile --filter "treeshake-test..." --filter "@typegpu/noise...")
# Usage:  package-test/run.sh            (~3-4 min; writes package-test/results/*)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p results
export npm_config_offline=true npm_config_update_notifier=false
echo "== 1/5 build both trees with upstream's build, replicate prepack, npm pack, offline npm install"
node stage.mjs 2>&1 | tee results/stage.log
echo "== 2/5 K1 (a)(b)(c)(d): tsc on shipped .d.ts, import effects, exports resolution, fake-device runtime"
node k1.mjs 2>&1 | tee results/k1.log || true
echo "== 3/5 K1 (d): upstream TEST_BUILT=1 vitest switch + sabotage proof"
node test-built.mjs 2>&1 | tee results/k1d-test-built.log || true
echo "== 4/5 B1/B2 bundle matrix (vite, esbuild, webpack, rollup)"
node bundle-matrix.mjs 2>&1 | tee results/bundle-matrix.log
echo "== 5/5 package surface + dist diff"
node surface.mjs > results/surface.log 2>&1
diff -ru -x instrumentation -x package.json -x '*.d.ts' work/pristine/node_modules/typegpu work/patched/node_modules/typegpu > results/dist-js-diff-pristine-vs-patched.txt || true
diff -ru -x instrumentation -x package.json -x '*.js' -x '*.mjs' work/pristine/node_modules/typegpu work/patched/node_modules/typegpu > results/dist-dts-diff-pristine-vs-patched.txt || true
echo "done: see package-test/results/ (k1-summary.json, bundle-matrix.md, surface.txt)"
