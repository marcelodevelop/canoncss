#!/bin/bash
set -e

cd "$(dirname "$0")/.."

OUTPUT="dist/canon.css"
SOURCES="src/reset.css src/tokens.css src/layouts.css src/components.css src/utilities.css"
mkdir -p dist

# ponytail: strip comments + indentation only. No token/selector rewriting -
# that is where CSS minifiers break data: URIs. 17kb is small enough.
{
  V=$(node -p "require('./package.json').version" 2>/dev/null || echo 0.0.0)
  echo "/* Canon CSS v$V | MIT License | https://canoncss.com */"
  # The order lives in bin/vocab.mjs, where canon-lint reads it too (R11).
  node --input-type=module -e "import {LAYERS} from './bin/vocab.mjs'; console.log('@layer ' + LAYERS.join(', ') + ';')"
  cat $SOURCES \
    | sed -e ':a' -e 'N' -e '$!ba' -e 's|/\*[^*]*\*\+\([^/*][^*]*\*\+\)*/||g' \
    | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e '/^$/d'
} > $OUTPUT

echo "✓ Built $OUTPUT ($(wc -c < $OUTPUT) bytes)"

# The prompts carry the same provenance header dist does. They are the artifact
# users copy into other repos, and the header is the only marker of which
# vocabulary generation a stale copy teaches - it sat at v0.1 through five
# releases because nothing wrote it. Line 1 only: system-prompt-full.txt shows
# "v0.1" further down as example badge markup that a global substitution would
# corrupt. Full x.y.z, because check-release matches \d+\.\d+\.\d+.
for PROMPT in prompts/system-prompt.txt prompts/system-prompt-full.txt; do
  sed -i "1s/^CANON CSS v[0-9][0-9.]*/CANON CSS v$V/" "$PROMPT"
done

# The AGENTS.md drop-in, generated from system-prompt.txt so there is one source.
{
  echo "# Canon CSS - agent instructions"
  echo ""
  echo "> Drop this file into your repo root (or append it to AGENTS.md / CLAUDE.md /"
  echo "> .cursor/rules). Any coding agent will then generate valid Canon markup."
  echo ""
  echo '```'
  cat prompts/system-prompt.txt
  echo '```'
} > prompts/AGENTS.md
echo "✓ Built prompts/AGENTS.md"

node scripts/gen-vscode-data.mjs
node scripts/gen-types.mjs
node scripts/gen-tokens.mjs
node scripts/gen-defaults.mjs
