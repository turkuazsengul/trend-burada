#!/usr/bin/env bash
# scripts/health.sh
#
# Polls every service's health endpoint and prints PASS/FAIL.
# Used by `make health` after `make up` so the CLAUDE.md "Faz 3 — Docker Stack"
# gate can be machine-verified, not eyeballed.
#
# Backoff: 30 attempts × 2s = up to 60s per service for slow first-build cold starts.

set -uo pipefail

declare -a CHECKS=(
  "config-server|http://localhost:8888/actuator/health"
  "backend|http://localhost:8080/actuator/health"
  "gateway|http://localhost:8090/actuator/health"
  "frontend|http://localhost:3000/"
  "keycloak|http://localhost:8081/realms/trend-burada/.well-known/openid-configuration"
  "mailpit|http://localhost:8025/api/v1/info"
)

MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"
SLEEP_BETWEEN="${SLEEP_BETWEEN:-2}"

green() { printf '\033[32m%s\033[0m' "$1"; }
red()   { printf '\033[31m%s\033[0m' "$1"; }
gray()  { printf '\033[90m%s\033[0m' "$1"; }

check_one() {
  local url="$1"
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 "$url" || echo "000")
  if [[ "$code" =~ ^(200|204)$ ]]; then
    return 0
  fi
  # Spring's /actuator/health returns 503 with body { "status": "DOWN" } when
  # something downstream is sick. Try parsing for "UP" anyway — sometimes it's 200
  # but the body explains things better when it's not.
  local body
  body=$(curl -sS --max-time 3 "$url" 2>/dev/null || true)
  if grep -q '"status":"UP"' <<<"$body"; then
    return 0
  fi
  return 1
}

declare -i PASS=0
declare -i FAIL=0

printf '%-16s %-58s %s\n' "SERVICE" "URL" "STATUS"
printf '%-16s %-58s %s\n' "----------------" "----------------------------------------------------------" "------"

for entry in "${CHECKS[@]}"; do
  IFS='|' read -r NAME URL <<<"$entry"
  attempt=0
  ok=false
  while (( attempt < MAX_ATTEMPTS )); do
    if check_one "$URL"; then
      ok=true
      break
    fi
    attempt=$((attempt + 1))
    sleep "$SLEEP_BETWEEN"
  done
  if $ok; then
    printf '%-16s %-58s %s\n' "$NAME" "$URL" "$(green PASS) ($((attempt+1))/$MAX_ATTEMPTS)"
    PASS=$((PASS + 1))
  else
    printf '%-16s %-58s %s\n' "$NAME" "$URL" "$(red FAIL) (timed out)"
    FAIL=$((FAIL + 1))
  fi
done

echo
echo "Summary: $(green "$PASS PASS"), $(red "$FAIL FAIL")"
echo

if (( FAIL > 0 )); then
  echo "Tip: $(gray "make logs SVC=<name>") to inspect a failing container."
  exit 1
fi
exit 0
