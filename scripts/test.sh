#!/bin/bash
# Self-check: canon-lint must pass clean markup and fail the violations fixture.
set -e
cd "$(dirname "$0")/.."

echo "- clean files must pass:"
node bin/canon-lint.mjs themes extensions examples test-llm/settings.html test-llm/dashboard.html test-llm/landing.html test-llm/blog.html test-llm/v2 test-llm/v3 test-llm/site-relay test-llm/repro-pricing test-llm/repro-pricing-v2 test-llm/repro-pricing-v3 test-llm/repro-dashboard test-llm/repro-dashboard-v2 test-llm/repro-dashboard-v3 test-llm/repro-pricing-v4 test-llm/control-tailwind test-llm/edit-density test-llm/edit-section test-llm/edit-density-dash test-llm/edit-remove

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

echo "- app-layer fixture must fail with exactly 2 violations:"
set +e
OUT2=$(node bin/canon-lint.mjs test-llm/app-layer-fixture.css)
CODE2=$?
set -e
COUNT2=$(echo "$OUT2" | grep -cE '  R6  ')
if [ "$CODE2" -ne 1 ] || [ "$COUNT2" -ne 2 ]; then
  echo "FAIL: expected exit 1 with 2 violations, got exit $CODE2 with $COUNT2:"
  echo "$OUT2"
  exit 1
fi
echo "✓ app-layer fixture caught ($COUNT2 violations, exit $CODE2)"

echo "- theme fixture must fail with exactly 2 violations:"
set +e
OUT3=$(node bin/canon-lint.mjs test-llm/theme-fixture.css)
CODE3=$?
set -e
COUNT3=$(echo "$OUT3" | grep -cE '  R7  ')
if [ "$CODE3" -ne 1 ] || [ "$COUNT3" -ne 2 ]; then
  echo "FAIL: expected exit 1 with 2 violations, got exit $CODE3 with $COUNT3:"
  echo "$OUT3"
  exit 1
fi
echo "✓ theme fixture caught ($COUNT3 violations, exit $CODE3)"

echo "- extension fixture must fail with exactly 3 violations:"
set +e
OUT4=$(node bin/canon-lint.mjs test-llm/extension-fixture)
CODE4=$?
set -e
COUNT4=$(echo "$OUT4" | grep -cE '  R8  ')
if [ "$CODE4" -ne 1 ] || [ "$COUNT4" -ne 3 ]; then
  echo "FAIL: expected exit 1 with 3 violations, got exit $CODE4 with $COUNT4:"
  echo "$OUT4"
  exit 1
fi
echo "✓ extension fixture caught ($COUNT4 violations, exit $CODE4)"

# The restyle corpus is a fixture rather than clean markup. Six clean-context
# agents wrote an inert border-radius into their escape hatch and every one
# reported the job done; R9 exists because of those six files, so they are the
# regression test for it. If this stops failing, R9 has stopped working.
echo "- restyle corpus must fail with exactly 6 R9 violations:"
set +e
OUT5=$(node bin/canon-lint.mjs test-llm/edit-restyle test-llm/edit-restyle-dash)
CODE5=$?
set -e
COUNT5=$(echo "$OUT5" | grep -cE '  R9  ')
if [ "$CODE5" -ne 1 ] || [ "$COUNT5" -ne 6 ]; then
  echo "FAIL: expected exit 1 with 6 violations, got exit $CODE5 with $COUNT5:"
  echo "$OUT5"
  exit 1
fi
echo "✓ restyle corpus caught ($COUNT5 violations, exit $CODE5)"

echo "- docs must match the vocabulary:"
node scripts/check-docs.mjs

echo "- repro metric self-check:"
node scripts/repro.mjs --selftest

echo "- rule 3 checker self-check:"
node scripts/check-tailwind-patterns.mjs --selftest

echo "✓ all tests passed"
