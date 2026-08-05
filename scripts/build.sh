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

# AGENTS.md drop-in: generado desde system-prompt.txt - una sola fuente de verdad.
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
node scripts/gen-tokens.mjs
node scripts/gen-defaults.mjs
