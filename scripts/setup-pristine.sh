#!/usr/bin/env bash
# Creates .work/typegpu-pristine (and typegpu-pristine-b): the same pinned upstream commit with NO patch
# and NO overlay. The first is the baseline of the overhead benchmark; the second is an identical copy
# used as an A/A control (any difference between the two is measurement bias, not code).
set -euo pipefail
source "$(dirname "$0")/env.sh"
for name in typegpu-pristine typegpu-pristine-b; do
  dir="$ROOT/.work/$name"
  [ -d "$dir/.git" ] && continue
  git clone --no-checkout "$WORK" "$dir"
  git -C "$dir" checkout -q --detach "$TYPEGPU_PIN"
  (cd "$dir" && pnpm install --frozen-lockfile --filter "typegpu..." --filter "typegpu-testing-utility...")
done
