#!/usr/bin/env bash
# Formats and lints overlay files + patched files with TypeGPU's own oxfmt/oxlint config,
# then copies the formatted overlay files back into this repo.
set -euo pipefail
source "$(dirname "$0")/env.sh"
"$ROOT/scripts/sync.sh"
cd "$WORK"
FILES="packages/typegpu/src/core/instrumentation packages/typegpu/tests/instrumentation $(git diff --name-only | tr '\n' ' ')"
pnpm exec oxfmt $FILES
pnpm exec oxlint -c oxlint.config.ts --max-warnings=0 --type-aware $FILES
for pair in "src:src/core/instrumentation" "tests:tests/instrumentation"; do
  rsync -a --exclude consumers --exclude bench "$PKG/${pair#*:}/" "$ROOT/overlay/${pair%%:*}/" 2>/dev/null || true
done
[ -d "$PKG/tests/instrumentation/consumers" ] && rsync -a "$PKG/tests/instrumentation/consumers/" "$ROOT/consumers/" || true
[ -d "$PKG/tests/instrumentation/bench" ] && rsync -a "$PKG/tests/instrumentation/bench/" "$ROOT/bench/" || true
