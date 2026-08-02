#!/bin/bash
set -e

cd "$(dirname "$0")/.."

OUTPUT="dist/canon.css"
SOURCES="src/reset.css src/tokens.css src/layouts.css src/components.css src/utilities.css"
mkdir -p dist

# ponytail: strip comments + indentation only. No token/selector rewriting —
# that is where CSS minifiers break data: URIs. 17kb is small enough.
{
  echo "/* Canon CSS v0.1.0 | MIT License | https://canon.css */"
  echo "@layer canon.reset, canon.tokens, canon.layouts, canon.components, canon.utilities;"
  cat $SOURCES \
    | sed -e ':a' -e 'N' -e '$!ba' -e 's|/\*[^*]*\*\+\([^/*][^*]*\*\+\)*/||g' \
    | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e '/^$/d'
} > $OUTPUT

echo "✓ Built $OUTPUT ($(wc -c < $OUTPUT) bytes)"
