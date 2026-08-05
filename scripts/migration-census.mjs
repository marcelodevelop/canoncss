#!/usr/bin/env node
// Counts what a Tailwind page spends its styling on, and what the same page
// spends it on in Canon. Every number in MIGRATING.md comes from here.
//
// The two corpora are the same two specs, a pricing page and an admin
// dashboard, generated five times each under both conditions:
//
//   test-llm/realistic-*   Tailwind under a competent house-style prompt with
//                          no closed vocabulary. This is the condition that
//                          matches how teams actually brief it, and therefore
//                          the thing anyone migrating is migrating from.
//   test-llm/repro-*       Canon, same specs, same generator.
//
// A doc full of numbers nobody can regenerate is the drift this repo already
// fixed once for the README. `npm run census` prints them; --check asserts
// MIGRATING.md still agrees.

import { readFileSync, readdirSync } from 'node:fs';

const TAILWIND = ['test-llm/realistic-pricing', 'test-llm/realistic-dashboard'];
const CANON = ['test-llm/repro-pricing', 'test-llm/repro-dashboard'];

const pages = (dirs) =>
  dirs.flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.html')).map((f) => `${d}/${f}`));

function classes(files) {
  const counts = new Map();
  for (const file of files) {
    const src = readFileSync(file, 'utf-8');
    for (const m of src.matchAll(/class="([^"]+)"/g)) {
      for (const name of m[1].split(/\s+/)) {
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
  }
  return counts;
}

function attributes(files) {
  const counts = new Map();
  for (const file of files) {
    const src = readFileSync(file, 'utf-8');
    for (const m of src.matchAll(/(data-[a-z-]+)="([^"]*)"/g)) {
      const key = `${m[1]}="${m[2]}"`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

// What happens to each family when the page becomes Canon. The point of the
// table is that most of it does not map to anything: it is absorbed by a
// component, by the reset, or by the theme, and simply stops being written.
const FAMILIES = [
  ['spacing', /^(p|m)(x|y|t|b|l|r|s|e)?-/, 'data-gap, data-padding, or the component'],
  ['type', /^(font-|text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)$|tracking-|leading-|uppercase$)/, 'the element and the type scale'],
  ['text colour', /^(hover:)?text-(slate|zinc|gray|neutral|stone|indigo|sky|emerald|teal|red|amber|white|black)/, 'the component, or data-tone'],
  ['flex and grid', /^(flex|grid|inline-flex|items-|justify-|gap-|col-span|row-|place-)/, 'data-layout'],
  ['focus rings', /^(focus|focus-visible):|^outline-/, 'nothing: the reset does it'],
  ['background', /^(hover:)?bg-/, 'the component, or the theme'],
  ['border', /^(border|divide)(-|$)/, 'the component'],
  ['radius', /^rounded/, 'the component, or --radius-* in the theme'],
  ['size', /^(w-|h-|max-w|min-w|max-h|min-h|size-)/, 'data-width, data-full, or the component'],
];

const twFiles = pages(TAILWIND);
const canonFiles = pages(CANON);
const tw = classes(twFiles);
const canon = attributes(canonFiles);
const twTotal = [...tw.values()].reduce((a, b) => a + b, 0);
const canonTotal = [...canon.values()].reduce((a, b) => a + b, 0);

const rows = [];
const seen = new Set();
for (const [name, re, becomes] of FAMILIES) {
  let uses = 0;
  let distinct = 0;
  for (const [cls, n] of tw) {
    if (seen.has(cls) || !re.test(cls)) continue;
    seen.add(cls);
    distinct++;
    uses += n;
  }
  rows.push({ name, distinct, uses, becomes, share: (100 * uses) / twTotal });
}
const restUses = twTotal - rows.reduce((a, r) => a + r.uses, 0);
const restDistinct = tw.size - seen.size;

const FIGURES = {
  twPages: twFiles.length,
  canonPages: canonFiles.length,
  twDistinct: tw.size,
  twTotal,
  canonDistinct: canon.size,
  canonTotal,
  twPerPage: Math.round(twTotal / twFiles.length),
  canonPerPage: Math.round(canonTotal / canonFiles.length),
};

if (process.argv.includes('--check')) {
  const doc = readFileSync('MIGRATING.md', 'utf-8');
  const failures = [];
  const must = [
    [`${FIGURES.twDistinct} distinct classes`, 'Tailwind distinct class count'],
    [`${FIGURES.twTotal.toLocaleString('en-US')} uses`, 'Tailwind total uses'],
    [`${FIGURES.canonDistinct} distinct`, 'Canon distinct pair count'],
    [`${FIGURES.canonTotal.toLocaleString('en-US')} uses`, 'Canon total uses'],
  ];
  for (const [needle, label] of must) {
    if (!doc.includes(needle)) failures.push(`MIGRATING.md no longer states the ${label} ("${needle}")`);
  }
  for (const r of rows) {
    if (!doc.includes(`| ${r.uses.toLocaleString('en-US')} |`)) {
      failures.push(`MIGRATING.md is missing the ${r.name} row (${r.uses.toLocaleString('en-US')} uses)`);
    }
  }
  if (failures.length) {
    console.error('✗ migration census drifted from MIGRATING.md');
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`✓ MIGRATING.md matches the census (${FIGURES.twTotal} Tailwind uses, ${FIGURES.canonTotal} Canon)`);
  process.exit(0);
}

console.log(`Tailwind, realistic prompt: ${FIGURES.twPages} pages, ${FIGURES.twDistinct} distinct classes, ${FIGURES.twTotal} uses (${FIGURES.twPerPage}/page)`);
console.log(`Canon, same specs:          ${FIGURES.canonPages} pages, ${FIGURES.canonDistinct} distinct pairs, ${FIGURES.canonTotal} uses (${FIGURES.canonPerPage}/page)`);
console.log();
console.log('| What it styles | Classes | Uses | Share | In Canon it becomes |');
console.log('|---|---|---|---|---|');
for (const r of rows.sort((a, b) => b.uses - a.uses)) {
  console.log(`| ${r.name} | ${r.distinct} | ${r.uses.toLocaleString('en-US')} | ${r.share.toFixed(1)}% | ${r.becomes} |`);
}
console.log(`| everything else | ${restDistinct} | ${restUses.toLocaleString('en-US')} | ${((100 * restUses) / twTotal).toFixed(1)}% | case by case |`);
