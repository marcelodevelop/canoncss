#!/bin/bash
# Type-checks types/canon.d.ts against types/canon.test-d.tsx.
#
# Separate from `npm test` on purpose: this is the only check in the repo that
# needs a dependency, and the framework's test suite stays runnable with nothing
# but node and bash. Installed with --no-save so nothing lands in package.json.
#
# It has to exist, though. A generated .d.ts that has never been compiled is a
# liability: a syntax error in it breaks the build of every consumer who imports
# it, and no other check here would notice.
set -e
cd "$(dirname "$0")/.."

if [ ! -d node_modules/typescript ] || [ ! -d node_modules/@types/react ]; then
  echo "- installing typescript and @types/react (--no-save):"
  npm install --no-save --no-fund --no-audit typescript@5 @types/react@18
fi

echo "- types must accept the vocabulary and reject everything else:"
# tsc fails on a @ts-expect-error whose line turns out to be fine, so the
# rejection cases are asserted as strictly as the acceptance ones.
node node_modules/typescript/bin/tsc --project types/tsconfig.json
echo "✓ types/canon.d.ts compiles and the vocabulary is enforced"
