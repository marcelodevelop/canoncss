#!/bin/bash
# Self-check: canon-lint must pass clean markup and fail the violations fixture.
set -e
cd "$(dirname "$0")/.."

echo "- clean files must pass:"
node bin/canon-lint.mjs themes extensions examples test-llm/settings.html test-llm/dashboard.html test-llm/landing.html test-llm/blog.html test-llm/v2 test-llm/v3 test-llm/repro-pricing test-llm/repro-pricing-v2 test-llm/repro-pricing-v3 test-llm/repro-dashboard-v2 test-llm/repro-dashboard-v3 test-llm/repro-pricing-v4 test-llm/control-tailwind test-llm/edit-density test-llm/edit-section test-llm/edit-density-dash test-llm/edit-remove

echo "- fixture must fail with exactly 6 violations:"
set +e
OUT=$(node bin/canon-lint.mjs test-llm/violations-fixture.html)
CODE=$?
set -e
COUNT=$(echo "$OUT" | grep -cE '  R[0-9]+  ')
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

# The accessible-name gap, baselined rather than edited away. These are
# generated pages and they are evidence of what the prompt produced, so fixing
# them by hand would delete the measurement. Seven controls across three files,
# every one of them in a toolbar or filter row where a visible label would be
# wrong and nobody wrote the invisible one instead.
#
# The second assertion is the one that matters: R10 must be the ONLY rule these
# files break. Coverage of every other rule is preserved on them, so this is a
# baseline for one known gap and not an amnesty.
echo "- corpus a11y baseline: exactly 7 R10 and no other rule:"
set +e
OUT6=$(node bin/canon-lint.mjs test-llm/site-relay test-llm/repro-dashboard)
CODE6=$?
set -e
R10=$(echo "$OUT6" | grep -cE '  R10  ')
ALL=$(echo "$OUT6" | grep -cE '  R[0-9]+  ')
if [ "$CODE6" -ne 1 ] || [ "$R10" -ne 7 ] || [ "$ALL" -ne 7 ]; then
  echo "FAIL: expected exit 1 with 7 violations, all R10; got exit $CODE6, $R10 R10 of $ALL total:"
  echo "$OUT6"
  exit 1
fi
echo "✓ a11y baseline holds ($R10 R10 violations, no other rule)"

# The prompt experiment, kept because it is a negative result about an
# intervention this project tried and reverted.
#
# Ten generations of one toolbar-heavy spec, five on the shipped prompt and five
# on a variant that added two lines telling the model to name its controls. Both
# came back with zero R10: the shipped prompt already labels controls correctly,
# so the intervention had nothing to fix. What it did change was how: the
# variant replaced 15 visible <label for> elements with 22 aria-labels, which is
# a worse interface for the same lint result. Reverted.
#
# The three R5 violations are ordinary generation noise, two in one arm and one
# in the other, and they are left alone because this corpus is evidence.
echo "- prompt experiment: zero R10 in both arms:"
# grep -c exits 1 when the count is zero, which is the result being asserted
# here, so errexit stays off until after it has run.
set +e
OUT7=$(node bin/canon-lint.mjs test-llm/a11y-old test-llm/a11y-new)
R10B=$(echo "$OUT7" | grep -cE '  R10  ')
set -e
if [ "$R10B" -ne 0 ]; then
  echo "FAIL: expected 0 R10 across both arms, got $R10B:"
  echo "$OUT7"
  exit 1
fi
echo "✓ both arms label their controls (0 R10)"

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

# canon-init had no test at all, and it shipped a bug that only showed up when
# the target was somewhere other than the working directory: the CSS went where
# it was told and AGENTS.md went to cwd, so `canon-init ../other-project` put
# the framework in one repo and the agent instructions in another.
echo "- canon-init writes where it says it writes:"
ROOT=$PWD
INIT_TMP=$(mktemp -d)
mkdir -p "$INIT_TMP/proj/.git" "$INIT_TMP/proj/src/styles" "$INIT_TMP/elsewhere"
(cd "$INIT_TMP/elsewhere" && node "$ROOT/bin/canon-init.mjs" "$INIT_TMP/proj/src/styles" >/dev/null)
for f in canon.css theme.css; do
  [ -f "$INIT_TMP/proj/src/styles/$f" ] || { echo "FAIL: $f not written to the target"; exit 1; }
done
# AGENTS.md belongs at the repo root, because that is where coding agents read
# it, and never in whatever directory the command happened to run from.
[ -f "$INIT_TMP/proj/AGENTS.md" ] || { echo "FAIL: AGENTS.md not at the repo root"; exit 1; }
[ -z "$(ls -A "$INIT_TMP/elsewhere")" ] || { echo "FAIL: canon-init wrote into cwd: $(ls -A "$INIT_TMP/elsewhere")"; exit 1; }
# Re-running must never overwrite: exit 1 and nothing written is the contract.
set +e
(cd "$INIT_TMP/elsewhere" && node "$ROOT/bin/canon-init.mjs" "$INIT_TMP/proj/src/styles" >/dev/null)
RERUN=$?
set -e
[ "$RERUN" -eq 1 ] || { echo "FAIL: re-run should exit 1 with nothing to do, got $RERUN"; exit 1; }
node bin/canon-lint.mjs "$INIT_TMP/proj/src/styles/theme.css" >/dev/null
node scripts/check-css.mjs "$INIT_TMP/proj/src/styles/theme.css" dist/canon.css >/dev/null
rm -rf "$INIT_TMP"
echo "✓ canon-init lands the CSS in the target and AGENTS.md at the root"

echo "- docs must match the vocabulary:"
node scripts/check-docs.mjs

echo "- repro metric self-check:"
node scripts/repro.mjs --selftest

# Every colour pair the components render, in both shipped themes and both
# modes, now clears its WCAG AA threshold. The gate fails in both directions:
# it catches a regression, and it catches a fix that nobody lowered the number
# for, so this stays at zero rather than drifting back into a baseline.
#
# It started at 17 failing pairs. The largest group was a theme's own palette
# and the most surprising was structural: a theme file is not in a layer, so
# its :root beats Canon's layered [data-theme="dark"], and any token a theme
# sets in one and forgets in the other serves its light value on a dark page.
echo "- every colour pair must clear WCAG AA:"
node scripts/check-contrast.mjs --max 0 > /dev/null

echo "- rule 3 checker self-check:"
node scripts/check-tailwind-patterns.mjs --selftest

# The shipped CSS was the one artifact nothing checked. This suite would pass
# with exit 0 on a dist/canon.css containing `color: ;;;` - measured before the
# gate was written, not assumed - and a broken declaration takes the rest of its
# block with it, so a component silently stops existing on every page.
echo "- css integrity checker self-check:"
node scripts/check-css.mjs --selftest

# dist alone, because the CDN serves it alone: every token it uses must be
# defined in it, not in a theme the page may not have loaded.
echo "- dist/canon.css must parse and be self-contained:"
node scripts/check-css.mjs dist/canon.css

# Themes and the reference extension resolve against Canon, so they are judged
# with it. src/ is not checked separately: dist is its concatenation, and the
# @layer order statement lives in build.sh rather than in any source file.
echo "- shipped themes and extensions must parse:"
node scripts/check-css.mjs dist/canon.css themes/*.css extensions/*.css

echo "✓ all tests passed"
