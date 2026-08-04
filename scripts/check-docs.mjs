#!/usr/bin/env node
// Asserts the docs still describe the vocabulary that actually exists.
//
// Adding a component means touching five files, and the README count is the
// one nobody remembers. It drifted the first time nav was added. A number a
// human has to keep in sync is a number that will be wrong, so CI keeps it.

import { readFileSync } from 'node:fs';
import { COMPONENTS, LAYOUTS } from '../bin/vocab.mjs';

const README = readFileSync('README.md', 'utf-8');
const failures = [];

function checkCount(label, actual, re) {
  const m = README.match(re);
  if (!m) {
    failures.push(`README no longer states a ${label} count in the API table`);
    return;
  }
  if (Number(m[1]) !== actual) {
    failures.push(`README says ${m[1]} ${label}s, vocab.mjs has ${actual}`);
  }
}

checkCount('component', COMPONENTS.size, /\|\s*`data-component`\s*\|\s*(\d+) components?:/);
checkCount('layout', LAYOUTS.size, /\|\s*`data-layout`\s*\|\s*(\d+) layout/);

// Every component must also be named, not just counted.
for (const name of COMPONENTS) {
  if (!README.includes(`\`${name}\``)) failures.push(`README never mentions \`${name}\``);
}
for (const name of LAYOUTS) {
  if (!README.includes(`\`${name}\``)) failures.push(`README never mentions \`${name}\``);
}

// The prompt is what the model actually reads: a component missing there is
// a component that does not exist in practice.
const prompt = readFileSync('prompts/system-prompt.txt', 'utf-8');
for (const name of COMPONENTS) {
  if (!prompt.includes(name)) failures.push(`prompts/system-prompt.txt never mentions ${name}`);
}

if (failures.length > 0) {
  console.error('✗ docs are out of sync with the vocabulary:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`✓ docs match the vocabulary (${COMPONENTS.size} components, ${LAYOUTS.size} layouts)`);
