#!/usr/bin/env bash
# Does the hook patch still apply to the current tip of upstream TypeGPU main?
# Only `git apply --check`: it says whether the hunks still match, not whether the result works.
#   TYPEGPU_UPSTREAM=<url or path> to test against something else (default: GitHub).
set -euo pipefail
source "$(dirname "$0")/env.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git clone --quiet --depth 1 --branch "${UPSTREAM_BRANCH:-main}" "$TYPEGPU_UPSTREAM" "$tmp/upstream"
tip="$(git -C "$tmp/upstream" rev-parse --short HEAD)"
echo "upstream tip: $tip (pinned base: ${TYPEGPU_PIN:0:8})"
if git -C "$tmp/upstream" apply --check "$ROOT/patches/0001-instrumentation-hooks.patch"; then
  echo "OK: the hook patch applies to upstream $tip"
else
  echo "DRIFT: the hook patch no longer applies to upstream $tip" >&2
  exit 1
fi
