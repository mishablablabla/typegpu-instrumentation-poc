#!/usr/bin/env bash
# Check-only version of format.sh: TypeGPU's own oxfmt and oxlint (with its config) on everything this repo
# adds or patches. Changes nothing; exits non-zero on any formatting difference or lint finding.
set -euo pipefail
source "$(dirname "$0")/env.sh"
"$ROOT/scripts/sync.sh"
cd "$WORK"
FILES="packages/typegpu/src/core/instrumentation packages/typegpu/tests/instrumentation $(git diff --name-only | tr '\n' ' ')"
# shellcheck disable=SC2086
pnpm exec oxfmt --check $FILES
# shellcheck disable=SC2086
pnpm exec oxlint -c oxlint.config.ts --max-warnings=0 --type-aware $FILES
