#!/bin/bash
# Self-check: canon-lint must pass clean markup and fail the violations fixture.
set -e
cd "$(dirname "$0")/.."

echo "- clean files must pass:"
node bin/canon-lint.mjs examples test-llm/settings.html test-llm/dashboard.html test-llm/landing.html test-llm/blog.html test-llm/v2 test-llm/v3 test-llm/site-relay test-llm/repro-pricing test-llm/repro-pricing-v2 test-llm/repro-pricing-v3 test-llm/repro-dashboard test-llm/repro-dashboard-v2 test-llm/repro-dashboard-v3 test-llm/repro-pricing-v4

echo "- fixture must fail with exactly 6 violations:"
set +e
OUT=$(node bin/canon-lint.mjs test-llm/violations-fixture.html)
CODE=$?
set -e
COUNT=$(echo "$OUT" | grep -cE '  R[0-9]  ')
if [ "$CODE" -ne 1 ] || [ "$COUNT" -ne 6 ]; then
  echo "FAIL: expected exit 1 with 6 violations, got exit $CODE with $COUNT:"
  echo "$OUT"
  exit 1
fi
echo "✓ fixture caught ($COUNT violations, exit $CODE)"

echo "- repro metric self-check:"
node scripts/repro.mjs --selftest

echo "✓ all tests passed"
