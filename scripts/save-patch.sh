#!/usr/bin/env bash
# Regenerates patches/0001-instrumentation-hooks.patch from the tracked-file edits in the checkout.
# New files live in overlay/ and are intentionally not part of the patch.
set -euo pipefail
source "$(dirname "$0")/env.sh"
mkdir -p "$ROOT/patches"
git -C "$WORK" diff -- packages/typegpu/src > "$ROOT/patches/0001-instrumentation-hooks.patch"
git -C "$WORK" diff --stat -- packages/typegpu/src
