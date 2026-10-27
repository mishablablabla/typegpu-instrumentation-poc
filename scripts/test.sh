#!/usr/bin/env bash
# Syncs the overlay, then runs the instrumentation tests (extra args go to vitest).
set -euo pipefail
source "$(dirname "$0")/env.sh"
"$ROOT/scripts/sync.sh"
cd "$PKG"
pnpm vitest run tests/instrumentation --exclude '**/bench/**' "$@"
