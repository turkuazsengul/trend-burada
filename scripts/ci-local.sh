#!/usr/bin/env bash
# scripts/ci-local.sh
#
# Local CI loop: detect which services changed since `main`, then run lint + test +
# build for each. Pass `--all` to skip detection and exercise every service.
#
# Used by `make ci` (default) and `make ci.all` (with --all). The CLAUDE.md workflow
# treats this script's exit code as the "Faz 2 — Local CI" gate: green here is the
# precondition for declaring work done.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------
RUN_ALL=false
if [[ "${1:-}" == "--all" ]]; then
  RUN_ALL=true
fi

# ---------------------------------------------------------------------------
# Service registry. Edit here if you add a new service.
# Format:  <name>  <path>  <test_cmd>  <build_cmd>
#
# A service is selected when its <path> appears in `git diff --name-only main`.
# ---------------------------------------------------------------------------
declare -a SERVICES=(
  "be|services/be|./mvnw -q test|./mvnw -q -DskipTests package"
  "fe|services/fe|npm test --silent --watchAll=false|npm run build"
  "gateway|services/gateway|./mvnw -q test|./mvnw -q -DskipTests package"
  "config-server|services/config-server|./mvnw -q test|./mvnw -q -DskipTests package"
)

# ---------------------------------------------------------------------------
# Detect base branch & changed paths
# ---------------------------------------------------------------------------
BASE_BRANCH="${BASE_BRANCH:-main}"
detect_changed() {
  if ! git rev-parse --verify "$BASE_BRANCH" >/dev/null 2>&1; then
    echo "(base branch '$BASE_BRANCH' not found — running ALL services as fallback)" >&2
    RUN_ALL=true
    return
  fi
  CHANGED_PATHS=$(git diff --name-only "$BASE_BRANCH"...HEAD 2>/dev/null || true)
  CHANGED_PATHS+=$'\n'$(git diff --name-only)            # uncommitted
  CHANGED_PATHS+=$'\n'$(git diff --name-only --cached)   # staged
}

if ! $RUN_ALL; then
  detect_changed
fi

service_touched() {
  local path="$1"
  $RUN_ALL && return 0
  echo "$CHANGED_PATHS" | grep -q "^$path/" && return 0 || return 1
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
declare -a RESULTS=()
declare -i TOTAL=0
declare -i RAN=0
declare -i FAILED=0
START_TS=$(date +%s)

for entry in "${SERVICES[@]}"; do
  IFS='|' read -r NAME PATH_ TEST_CMD BUILD_CMD <<<"$entry"
  TOTAL=$((TOTAL + 1))

  if ! service_touched "$PATH_"; then
    RESULTS+=("SKIP  $NAME (no changes under $PATH_)")
    continue
  fi

  RAN=$((RAN + 1))
  echo
  echo "════════════════════════════════════════════════════════════════════════"
  echo "  $NAME — test"
  echo "════════════════════════════════════════════════════════════════════════"
  if ( cd "$PATH_" && eval "$TEST_CMD" ); then
    TEST_STATUS=PASS
  else
    TEST_STATUS=FAIL
    FAILED=$((FAILED + 1))
    RESULTS+=("FAIL  $NAME — test")
    continue
  fi

  echo
  echo "── $NAME — build"
  if ( cd "$PATH_" && eval "$BUILD_CMD" ); then
    BUILD_STATUS=PASS
    RESULTS+=("PASS  $NAME (test+build)")
  else
    BUILD_STATUS=FAIL
    FAILED=$((FAILED + 1))
    RESULTS+=("FAIL  $NAME — build")
  fi
done

END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

echo
echo "════════════════════════════════════════════════════════════════════════"
echo "  Local CI summary  (${ELAPSED}s)"
echo "════════════════════════════════════════════════════════════════════════"
for r in "${RESULTS[@]}"; do
  echo "  $r"
done
echo
echo "  total=$TOTAL  ran=$RAN  failed=$FAILED"
echo

if (( FAILED > 0 )); then
  exit 1
fi
exit 0
