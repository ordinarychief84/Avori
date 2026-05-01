#!/usr/bin/env bash
set -uo pipefail
BASE="${1:-http://localhost:3000}"
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "==============================="
echo "Avori E2E test suite"
echo "Target: $BASE"
echo "==============================="
echo

# Cross-tenant runs FIRST: it needs to create a brand B via /api/signup,
# which would otherwise be blocked by the rate-limit triggered by e2e.sh.
bash "$HERE/e2e-cross-tenant.sh" "$BASE"; A=$?
echo
bash "$HERE/e2e-admin.sh" "$BASE"; B=$?
echo
bash "$HERE/e2e.sh" "$BASE"; C=$?

echo
echo "==============================="
if [ $A -eq 0 ] && [ $B -eq 0 ] && [ $C -eq 0 ]; then
  echo "ALL SUITES PASSED"
  exit 0
else
  echo "FAILURES: cross-tenant=$A admin=$B e2e=$C"
  exit 1
fi
