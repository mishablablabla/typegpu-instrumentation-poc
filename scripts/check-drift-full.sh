#!/usr/bin/env bash
# Stronger than check-drift.sh: applies the hook patch to the current tip of upstream main, installs, then runs
# the instrumentation tests and the type check there. Says that the result still works, not only that the hunks match.
#   TYPEGPU_UPSTREAM=<url or path>  UPSTREAM_BRANCH=main  KEEP=1 (keep the checkout)
set -euo pipefail
source "$(dirname "$0")/env.sh"
tmp="$(mktemp -d)"
[ -n "${KEEP:-}" ] || trap 'rm -rf "$tmp"' EXIT
git clone --quiet --depth 1 --branch "${UPSTREAM_BRANCH:-main}" "$TYPEGPU_UPSTREAM" "$tmp/upstream"
echo "upstream tip: $(git -C "$tmp/upstream" rev-parse --short HEAD)"
git -C "$tmp/upstream" apply "$ROOT/patches/0001-instrumentation-hooks.patch"
(cd "$tmp/upstream" && pnpm install --frozen-lockfile --filter "typegpu..." --filter "typegpu-testing-utility..." >/dev/null)
export TYPEGPU_WORK="$tmp/upstream"
source "$(dirname "$0")/env.sh"
"$ROOT/scripts/test.sh"
(cd "$tmp/upstream/packages/typegpu" && pnpm test:types)
echo "OK: patch + overlay pass the instrumentation tests and tsc on upstream $(git -C "$tmp/upstream" rev-parse --short HEAD)"
