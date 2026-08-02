#!/bin/bash
# Self-check: canon-lint must pass clean markup and fail the violations fixture.
set -e
cd "$(dirname "$0")/.."

echo "— clean files must pass:"
node bin/canon-lint.mjs examples test-llm/settings.html

echo "— fixture must fail with exactly 5 violations:"
set +e
OUT=$(node bin/canon-lint.mjs test-llm/violations-fixture.html)
CODE=$?
set -e
COUNT=$(echo "$OUT" | grep -cE '  R[0-9]  ')
if [ "$CODE" -ne 1 ] || [ "$COUNT" -ne 5 ]; then
  echo "FAIL: expected exit 1 with 5 violations, got exit $CODE with $COUNT:"
  echo "$OUT"
  exit 1
fi
echo "✓ fixture caught ($COUNT violations, exit $CODE)"
echo "✓ all tests passed"
