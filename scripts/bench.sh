#!/usr/bin/env bash
# Runs the overhead benchmark REPS times for each configuration, rotating the order every repetition,
# one fresh process per run. Appends to bench/results/<stamp>.jsonl.
#   REPS=7 scripts/bench.sh
# Configurations: pristine, pristine-b (A/A control), disabled, enabled.
set -euo pipefail
source "$(dirname "$0")/env.sh"
REPS="${REPS:-7}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$ROOT/bench/results/$STAMP.jsonl"
mkdir -p "$ROOT/bench/results"

"$ROOT/scripts/sync.sh"
for name in typegpu-pristine typegpu-pristine-b; do
  mkdir -p "$ROOT/.work/$name/packages/typegpu/tests/instrumentation/bench"
  rsync -a "$ROOT/bench/overhead.test.ts" "$ROOT/.work/$name/packages/typegpu/tests/instrumentation/bench/"
done

run() { # config, tree, instrumentation flag
  (cd "$2/packages/typegpu" && env BENCH_CONFIG="$1" BENCH_OUT="$OUT" ${3:+BENCH_INSTRUMENTATION=$3} \
    pnpm vitest run tests/instrumentation/bench >/dev/null)
}

order=(pristine pristine-b disabled enabled)
for rep in $(seq 1 "$REPS"); do
  for config in "${order[@]}"; do
    case "$config" in
      pristine)   run pristine "$ROOT/.work/typegpu-pristine" "" ;;
      pristine-b) run pristine-b "$ROOT/.work/typegpu-pristine-b" "" ;;
      disabled)   run disabled "$WORK" "" ;;
      enabled)    run enabled "$WORK" 1 ;;
    esac
  done
  order=("${order[@]:1}" "${order[0]}")   # rotate
  echo "rep $rep/$REPS done" >&2
done
echo "$OUT"
