#!/usr/bin/env bash
# Copies the overlay (new files owned by this repo) into the TypeGPU checkout.
set -euo pipefail
source "$(dirname "$0")/env.sh"

sync_dir() {
  [ -d "$1" ] || return 0
  # same result as `rsync -a --delete`, without needing rsync (absent from Git Bash on Windows)
  rm -rf "$2"
  mkdir -p "$2"
  cp -R "$1/." "$2/"
}

sync_dir "$ROOT/overlay/src" "$PKG/src/core/instrumentation"
sync_dir "$ROOT/overlay/tests" "$PKG/tests/instrumentation"
sync_dir "$ROOT/consumers" "$PKG/tests/instrumentation/consumers"
sync_dir "$ROOT/bench" "$PKG/tests/instrumentation/bench"
sync_dir "$ROOT/real-gpu/page" "$PKG/tests/instrumentation/real-gpu-page"
sync_dir "$ROOT/examples" "$PKG/tests/instrumentation/examples"
mkdir -p "$PKG/tests/instrumentation" && cp "$ROOT/real-gpu/classify.ts" "$PKG/tests/instrumentation/classify.ts"
sync_dir "$ROOT/real-gpu/bench-page" "$PKG/tests/instrumentation/real-gpu-bench"
cp "$ROOT/real-gpu/page/provenance.ts" "$PKG/tests/instrumentation/real-gpu-bench/provenance.ts"
