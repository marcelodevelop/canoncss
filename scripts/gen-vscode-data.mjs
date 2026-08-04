// Emits vscode/canon.html-data.json from the vocabulary, so the editor
// autocompletes exactly what canon-lint accepts. Run by scripts/build.sh.
import { writeFileSync, mkdirSync } from 'node:fs';
import { VOCAB, DESC, ELEMENTS } from '../bin/vocab.mjs';

const globalAttributes = Object.entries(VOCAB).map(([name, values]) => ({
  name,
  description:
    name === 'data-component'
      ? `${DESC[name]}\n\n${Object.entries(ELEMENTS).map(([role, tags]) => `${role}: ${[...tags].map((t) => `<${t}>`).join(', ')}`).join('\n')}`
      : DESC[name],
  values: [...values].map((v) => ({ name: v })),
}));

// The extension namespace. Open by design, so there is no value list to offer,
// but the editor should still know the attributes exist rather than flagging
// them as unknown.
const EXTENSION = {
  'data-x-component': 'An extension component Canon does not have. Kebab-case, styled in @layer canon.app from tokens.',
  'data-x-slot': 'A named region of an extension component.',
  'data-x-variant': 'A variant of an extension component. Any kebab-case value: this is where values Canon does not have go.',
  'data-x-state': 'A state of an extension component. Any kebab-case value.',
};
for (const [name, description] of Object.entries(EXTENSION)) {
  globalAttributes.push({ name, description });
}

// Valueless utilities: present or absent, no autocomplete list.
for (const name of ['data-mono', 'data-full', 'data-truncate', 'data-wrap']) {
  globalAttributes.push({ name, description: 'Canon utility (no value).', valueSet: 'v' });
}

mkdirSync('vscode', { recursive: true });
writeFileSync(
  'vscode/canon.html-data.json',
  JSON.stringify({ version: 1.1, globalAttributes }, null, 2) + '\n'
);
console.log(`✓ Built vscode/canon.html-data.json (${globalAttributes.length} attributes)`);
