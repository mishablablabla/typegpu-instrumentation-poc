#!/usr/bin/env bash
# Everything CI runs after setup, in one command: mock-based tests, type check, lint/format check.
# Needs scripts/setup.sh to have been run. No GPU and no browser are used.
set -euo pipefail
source "$(dirname "$0")/env.sh"
echo "== tests (mock device)"
"$ROOT/scripts/test.sh"
echo "== type check"
(cd "$PKG" && pnpm test:types)
echo "== lint and format check"
"$ROOT/scripts/lint.sh"
