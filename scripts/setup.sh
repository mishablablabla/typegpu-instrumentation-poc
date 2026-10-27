#!/usr/bin/env bash
# Creates .work/typegpu: a throwaway checkout of upstream TypeGPU at the pinned commit,
# with this repo's hook patches applied and the overlay files copied in.
set -euo pipefail
source "$(dirname "$0")/env.sh"

if [ -d "$WORK/.git" ]; then
  echo "$WORK already exists; delete .work/ to start over." >&2
  exit 1
fi

mkdir -p "$ROOT/.work"
git clone --no-checkout "$TYPEGPU_UPSTREAM" "$WORK"
git -C "$WORK" checkout -q --detach "$TYPEGPU_PIN"

for patch in "$ROOT"/patches/*.patch; do
  [ -e "$patch" ] || continue
  git -C "$WORK" apply "$patch"
done

(cd "$WORK" && pnpm install --frozen-lockfile --filter "typegpu..." --filter "typegpu-testing-utility...")
"$ROOT/scripts/sync.sh"
