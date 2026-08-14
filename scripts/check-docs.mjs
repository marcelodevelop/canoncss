#!/usr/bin/env node
// Asserts the docs still describe the vocabulary that actually exists.
//
// Adding a component means touching five files, and the README count is the
// one nobody remembers. It drifted the first time nav was added. A number a
// human has to keep in sync is a number that will be wrong, so CI keeps it.

import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { COMPONENTS, LAYOUTS } from '../bin/vocab.mjs';
import { TOKENS } from '../bin/tokens.mjs';

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

// Mentioned is not enough: it has to be listed like its siblings. Both prompts
// are hand-aligned tables and both had `stepper` indented four spaces where
// every other entry sits at two, so the one block describing a component read
// as a continuation of the line above it. Cheap to assert, and this is the file
// the whole thesis rests on.
for (const file of ['prompts/system-prompt.txt', 'prompts/system-prompt-full.txt']) {
  const src = readFileSync(file, 'utf-8');
  for (const name of [...COMPONENTS, ...LAYOUTS]) {
    if (!new RegExp(`^ {2}${name} `, 'm').test(src)) {
      failures.push(`${file} does not list ${name} at the table's own indentation`);
    }
  }
}

// The README count was kept in sync above and the other shipped docs were not,
// so they drifted exactly as predicted: EXTENDING.md opened on "Canon has
// fourteen components" and MIGRATING.md said 15, three releases after it became
// 17. Both were the first paragraph a reader lands on.
//
// Spelled-out numbers are read too, because that is how one of them was written
// and a check that only understands digits would have passed it. CHANGELOG.md is
// excluded on purpose: its counts describe the release they sit in and are
// supposed to say 12.
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty'];
const asNumber = (word) => {
  const i = WORDS.indexOf(word.toLowerCase());
  return i === -1 ? Number(word) : i;
};

for (const file of ['README.md', 'EXTENDING.md', 'MIGRATING.md', 'RESEARCH.md']) {
  const src = readFileSync(file, 'utf-8');
  const counts = { components: COMPONENTS.size, layouts: LAYOUTS.size };
  for (const m of src.matchAll(new RegExp(`\\b(${WORDS.join('|')}|\\d+)\\s+(components|layouts)\\b`, 'gi'))) {
    const actual = counts[m[2].toLowerCase()];
    if (asNumber(m[1]) !== actual) {
      failures.push(`${file} says "${m[1]} ${m[2]}", vocab.mjs has ${actual}`);
    }
  }
}

// Every token must be read by the framework. Three sat in tokens.css for five
// releases consumed by nothing, and a shipped theme (soft) overrode one of
// them in the reasonable belief that it did something: --weight-normal: 450,
// counted as brand surface by the linter, rendering nothing. A token nothing
// reads is the R7/R9 failure one level up, published as vocabulary.
{
  const defined = [...readFileSync('src/tokens.css', 'utf-8').matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)]
    .map((m) => m[1]);
  const consumers = ['src/reset.css', 'src/layouts.css', 'src/components.css', 'src/utilities.css']
    .map((f) => readFileSync(f, 'utf-8'))
    .join('\n');
  for (const token of new Set(defined)) {
    if (!consumers.includes(`var(${token}`)) {
      failures.push(`${token} is defined in tokens.css and read by nothing - wire it or remove it`);
    }
  }
}

// The inverse of the dead-token check above: every token the prompts teach must
// exist. 0.6.0 removed --leading-loose and --duration-slow from tokens.css and
// the full prompt kept teaching both, so anyone copying from the official
// prompt wrote var()s the framework never reads and canon-lint flagged as R7.
//
// Scoped to the two prompt token tables on purpose. A broad scan of README/
// EXTENDING/MIGRATING/themes produced ~8 false-positive classes: CLI flags
// (--theme, --churn), markdown table rules (|---|), glob notation
// (--radius-*), and deliberate typo examples. Do not widen this.
{
  for (const file of ['prompts/system-prompt.txt', 'prompts/system-prompt-full.txt']) {
    const src = readFileSync(file, 'utf-8');
    // Brace patterns can wrap across lines (--color-{...} spans three), so the
    // variant class deliberately matches newlines and each variant is trimmed.
    for (const m of src.matchAll(/--([a-z0-9-]+)-\{([^}]+)\}/g)) {
      for (const variant of m[2].split('|').map((v) => v.trim())) {
        const token = `--${m[1]}-${variant}`;
        if (!TOKENS.has(token)) {
          failures.push(`${file} teaches ${token}, which tokens.css does not define - the prompt is publishing a ghost token`);
        }
      }
    }
  }
}

// The equal-column fix must not regress in the teaching materials. Canon's own
// grid moved to minmax(0, 1fr) in 0.5.0 with a measured case, and the old
// pattern survived in the README, EXTENDING.md and the reference extension -
// the three places people copy from. A bare 1fr is minmax(auto, 1fr), so one
// wide cell breaks the equal columns the example promises.
{
  const teaching = ['README.md', 'EXTENDING.md', 'MIGRATING.md',
    ...readdirSync('extensions').filter((f) => f.endsWith('.css')).map((f) => `extensions/${f}`),
    ...readdirSync('themes').filter((f) => f.endsWith('.css')).map((f) => `themes/${f}`)];
  for (const file of teaching) {
    const src = readFileSync(file, 'utf-8');
    // The count is a bare word (a number, auto-fill) followed directly by 1fr:
    // anything looser also matches the minmax(0, 1fr) inside the fixed form.
    const line = src.split('\n').findIndex((l) => /repeat\(\s*[\w-]+\s*,\s*1fr\s*\)/.test(l));
    if (line !== -1) {
      failures.push(`${file}:${line + 1} uses repeat(N, 1fr) - a track will not shrink below its content; use minmax(0, 1fr)`);
    }
  }
}

// Sizes drift the same way counts do, and worse, because nothing about editing
// a stylesheet reminds you that a number in the README describes it. Every one
// of these was wrong when it was checked: the CSS had grown from 24kb to 27kb,
// the short prompt from 3.7kb to 5.9kb, and the metric from 200 lines to 335.
// A tolerance rather than an exact match, so an ordinary edit does not fail the
// build, but tight enough that the drift above would have.
function checkSize(label, file, actualKb, re, source = README, tolerance = 0.6) {
  const m = source.match(re);
  if (!m) {
    failures.push(`${file} no longer states a size for ${label}`);
    return;
  }
  if (Math.abs(Number(m[1]) - actualKb) > tolerance) {
    failures.push(`${file} says ${m[1]}kb for ${label}, it is ${actualKb.toFixed(1)}kb`);
  }
}

// Line endings are normalised before measuring. Git hands out CRLF on Windows
// checkouts and the build writes LF, which is a byte per line and about a
// kilobyte across canon.css: enough to fail this check on one platform and pass
// it on another, which is worse than not checking at all.
const kb = (path) => readFileSync(path, 'utf-8').replace(/\r\n/g, '\n').length / 1000;
const PROMPTS_README = readFileSync('prompts/README.md', 'utf-8');

checkSize('dist/canon.css', 'README.md', kb('dist/canon.css'), /~([\d.]+)kb raw/);
checkSize('the short prompt', 'README.md', kb('prompts/system-prompt.txt'), /\(([\d.]+)kb, roughly/);
checkSize('the short prompt', 'prompts/README.md', kb('prompts/system-prompt.txt'), /`system-prompt\.txt`\s*\|\s*([\d.]+)kb/, PROMPTS_README);
checkSize('the full prompt', 'prompts/README.md', kb('prompts/system-prompt-full.txt'), /`system-prompt-full\.txt`\s*\|\s*([\d.]+)kb/, PROMPTS_README);

// The gzipped figure is the one people actually compare frameworks on, so it is
// worth being right about. Node ships the compressor, so there is no reason to
// take the README's word for it.
const gzipKb =
  gzipSync(readFileSync('dist/canon.css', 'utf-8').replace(/\r\n/g, '\n')).length / 1000;
checkSize('gzipped canon.css', 'README.md', gzipKb, /~([\d.]+)kb gzipped/);

// RESEARCH.md is the piece written to be read by strangers, and it describes
// the metric they are being invited to check.
const RESEARCH = readFileSync('RESEARCH.md', 'utf-8');
const metricLines = readFileSync('scripts/repro.mjs', 'utf-8').split('\n').length;
const claimed = RESEARCH.match(/about (\d+) lines with no dependencies/);
if (!claimed) failures.push('RESEARCH.md no longer states the size of the metric');
else if (Math.abs(Number(claimed[1]) - metricLines) > 25) {
  failures.push(`RESEARCH.md says the metric is about ${claimed[1]} lines, repro.mjs is ${metricLines}`);
}

// Every rule canon-lint can emit has to be described where the people running
// it will look. A rule nobody documented is a build that fails with a code the
// reader has to go and grep for.
//
// R10 had already drifted this way: it shipped, it was in the changelog, and
// the README never mentioned it. This is a count a human has to keep in sync,
// which is the category this file exists for.
const LINT = readFileSync('bin/canon-lint.mjs', 'utf-8');
// The RULES table is the --help text, so its own entries are not evidence that
// a rule is implemented. Read the emitted codes from everything else.
const helpTable = LINT.match(/const RULES = \[[\s\S]*?\n\];/)?.[0] ?? '';
const emitted = [...new Set([...LINT.replace(helpTable, '').matchAll(/'(R\d+)'/g)].map((m) => m[1]))];
for (const rule of emitted) {
  if (!new RegExp(`\\b${rule}\\b`).test(README)) {
    failures.push(`canon-lint emits ${rule} and README.md never explains it`);
  }
  if (!new RegExp(`'${rule}'`).test(helpTable)) {
    failures.push(`canon-lint emits ${rule} and its own --help never lists it`);
  }
}

if (failures.length > 0) {
  console.error('✗ docs are out of sync with the vocabulary:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`✓ docs match the vocabulary (${COMPONENTS.size} components, ${LAYOUTS.size} layouts)`);
