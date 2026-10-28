# Shared settings for the POC scripts.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Upstream TypeGPU commit this POC is built and measured against (parent of the research commit, on origin/main).
TYPEGPU_PIN=7c853fa3a20b46050f59dd0360e21237f0debf53
# Override with a local clone to avoid the network: TYPEGPU_UPSTREAM=/path/to/TypeGPU scripts/setup.sh
TYPEGPU_UPSTREAM="${TYPEGPU_UPSTREAM:-https://github.com/software-mansion/TypeGPU}"
WORK="${TYPEGPU_WORK:-$ROOT/.work/typegpu}"
PKG="$WORK/packages/typegpu"
