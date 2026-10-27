#!/usr/bin/env bash
# Copies the overlay (new files owned by this repo) into the TypeGPU checkout.
set -euo pipefail
source "$(dirname "$0")/env.sh"

sync_dir() {
  mkdir -p "$2"
  rsync -a --delete "$1/" "$2/"
}

sync_dir "$ROOT/overlay/src" "$PKG/src/core/instrumentation"
sync_dir "$ROOT/overlay/tests" "$PKG/tests/instrumentation"
sync_dir "$ROOT/consumers" "$PKG/tests/instrumentation/consumers"
sync_dir "$ROOT/bench" "$PKG/tests/instrumentation/bench"
