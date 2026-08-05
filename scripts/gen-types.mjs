// Emits types/canon.d.ts from the vocabulary, so TypeScript rejects exactly
// what canon-lint rejects. Run by scripts/build.sh.
//
// A closed vocabulary is a union type. That is the whole reason this file
// exists: Canon's thesis and TypeScript's string-literal unions are the same
// idea, and every TSX codebase was getting none of it. React types allow any
// `data-*` attribute with any value, so `data-layout="stak"` compiled fine and
// stayed wrong until canon-lint ran, or until someone looked at the page.
//
// The augmentation makes the vocabulary a compile error and an autocomplete
// list in the same stroke, which is the R1 check moved from CI to the keystroke.
import { writeFileSync, mkdirSync } from 'node:fs';
import { VOCAB, DESC, ELEMENTS } from '../bin/vocab.mjs';

const union = (values) => [...values].map((v) => `'${v}'`).join(' | ');

const attributes = Object.entries(VOCAB)
  .map(([name, values]) => {
    const doc =
      name === 'data-component'
        ? `${DESC[name]}\n   *\n   * ${Object.entries(ELEMENTS)
            .map(([role, tags]) => `\`${role}\` on ${[...tags].map((t) => `\`<${t}>\``).join(' | ')}`)
            .join('\n   * ')}`
        : DESC[name];
    return `  /**\n   * ${doc}\n   */\n  '${name}'?: ${union(values)} | undefined;`;
  })
  .join('\n\n');

// The extension namespace is open by design (that is what makes it an escape
// hatch), so it types as a string rather than a union. Declaring it at all is
// still worth it: it documents the namespace at the point of use and keeps the
// two spellings from being equally plausible.
const EXTENSION = {
  'data-x-component': 'An extension component Canon does not have. Kebab-case, styled in @layer canon.app from tokens.',
  'data-x-slot': 'A named region of an extension component.',
  'data-x-variant': 'A variant of an extension component. Any kebab-case value: this is where values Canon does not have go.',
  'data-x-state': 'A state of an extension component. Any kebab-case value.',
};

const extension = Object.entries(EXTENSION)
  .map(([name, doc]) => `  /**\n   * ${doc}\n   */\n  '${name}'?: string | undefined;`)
  .join('\n\n');

// Valueless utilities. Present or absent, so `true` is the only value that
// means anything and the empty string is what HTML actually serialises.
const UTILITIES = ['data-mono', 'data-full', 'data-truncate', 'data-wrap'];
const utilities = UTILITIES.map(
  (name) => `  /**\n   * Canon utility. Present or absent, no value.\n   */\n  '${name}'?: boolean | '' | undefined;`
).join('\n\n');

const body = [attributes, extension, utilities]
  .join('\n\n')
  .replace(/^ {2}(?=\S|\*)/gm, '    ')
  .replace(/^ {3}\*/gm, '     *');

const out = `// Generated from bin/vocab.mjs by scripts/gen-types.mjs. Do not edit.
//
// Canon's vocabulary as TypeScript. A closed vocabulary is a union type, so
// this is the R1 check moved from CI to the keystroke: \`data-layout="stak"\`
// stops compiling, and every attribute autocompletes with exactly the values
// canon-lint accepts.
//
// React only. Add it to your tsconfig "include", or import it once:
//
//   import 'canoncss/types';
//
// It augments React's HTMLAttributes, so it applies to every intrinsic element
// with no per-element wiring and no runtime cost. Every attribute is optional,
// so existing code keeps compiling; what changes is that a wrong value is now
// wrong at the keystroke.
//
// Values written as expressions (\`data-variant={x}\`) are checked against the
// union like anything else, which is the case canon-lint reports as opaque and
// cannot check at all.

import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
${body}
  }
}

export {};
`;

mkdirSync('types', { recursive: true });
writeFileSync('types/canon.d.ts', out);
const count = Object.keys(VOCAB).length + Object.keys(EXTENSION).length + UTILITIES.length;
console.log(`✓ Built types/canon.d.ts (${count} attributes)`);
