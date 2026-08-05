#!/usr/bin/env node
// Rule 3 checker for the Tailwind control condition, written to REFUTE a
// finding of this project's own.
//
// check-tailwind-control.mjs enforces rule 1, the allowed utility set, and it
// reported zero violations on files where a density edit had taken `p-6` (the
// Card pattern) down to one use and `py-12` (Centered page) down to zero. The
// finding drawn from that was that a house style's component patterns are not
// mechanically enforceable, and therefore that ordinary editing dismantles the
// specification with nothing to catch it.
//
// That is a strong claim to rest on a checker nobody had written. So this is
// the checker, built as well as it can be built rather than built to fail.
//
// The method is the only one available. Tailwind carries no marker for what an
// element is meant to be, so a pattern has to be recognised by its own classes.
// Each pattern is split into a SIGNATURE, its distinctive non-spacing classes,
// and the SPACING it is required to carry. An element holding the whole
// signature is taken to be that component, and is then checked for the spacing.
//
// Usage: node scripts/check-tailwind-patterns.mjs <files...>
//        node scripts/check-tailwind-patterns.mjs --selftest

import { readFileSync } from 'node:fs';

const SPACING = /^(p|px|py|pt|pb|m|mt|mb|gap|space-y)-/;

// Straight from the COMPONENT PATTERNS and LAYOUT PATTERNS blocks of
// prompts/experiments/tailwind-control.txt. Patterns whose spacing is a
// variable step, the stacks and rows and grids, are not here: the prompt lets
// the step vary, so there is nothing fixed to check.
const PATTERNS = {
  'Button primary': 'rounded-md bg-teal-700 px-4 py-2 text-white hover:bg-teal-800',
  'Button secondary': 'rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-50',
  'Card': 'rounded-lg border border-zinc-200 bg-white p-6',
  'Card featured': 'rounded-lg border-2 border-teal-700 bg-white p-6 shadow-lg',
  'Badge': 'inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs',
  'Input': 'w-full rounded-md border border-zinc-300 px-3 py-2',
  'Topbar': 'flex items-center justify-between border-b border-zinc-200 px-6 py-4',
  'Nav link': 'block rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100',
  'Nav link current': 'block rounded-md bg-teal-50 px-3 py-2 text-teal-700 font-medium',
  'Centered page': 'mx-auto max-w-* px-6 py-12',
};

// `mx-auto max-w-prose` on a paragraph is a centred line of text, not the
// Centered page container, and on the first run that cost seven false
// positives against unedited files. Tailwind gives no way to tell the two
// apart from the classes, so the tag is the only signal left.
const TAGS = {
  'Centered page': new Set(['div', 'section', 'main', 'article', 'header', 'footer']),
};

export function split(pattern) {
  const parts = pattern.split(/\s+/).filter(Boolean);
  return {
    signature: parts.filter((c) => !SPACING.test(c)),
    spacing: parts.filter((c) => SPACING.test(c)),
  };
}

/** A signature class matches literally, except for the one wildcard the prompt
 *  itself writes as a choice, `max-w-{width}`. */
function has(classes, wanted) {
  if (wanted.endsWith('-*')) {
    const prefix = wanted.slice(0, -1);
    return classes.some((c) => c.startsWith(prefix));
  }
  return classes.includes(wanted);
}

export function classify(classes, tag = 'div') {
  let best = null;
  for (const [name, pattern] of Object.entries(PATTERNS)) {
    if (TAGS[name] && !TAGS[name].has(tag)) continue;
    const { signature, spacing } = split(pattern);
    if (!signature.every((c) => has(classes, c))) continue;
    // Most specific wins: Input and Button secondary share four classes, and
    // only `w-full` tells them apart.
    if (!best || signature.length > best.signature.length) best = { name, signature, spacing };
  }
  return best;
}

function check(file) {
  const source = readFileSync(file, 'utf-8');
  const violations = [];
  let matched = 0;
  for (const m of source.matchAll(/<([a-z][a-z0-9]*)\b[^>]*?\bclass="([^"]*)"/g)) {
    const classes = m[2].split(/\s+/).filter(Boolean);
    const hit = classify(classes, m[1]);
    if (!hit) continue;
    matched++;
    const missing = hit.spacing.filter((c) => !classes.includes(c));
    if (missing.length) violations.push({ name: hit.name, missing, classes: m[2] });
  }
  return { matched, violations };
}

function selftest() {
  const eq = (got, want, label) => {
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      throw new Error(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
  };
  eq(split('rounded-lg border bg-white p-6').spacing, ['p-6'], 'spacing split');
  eq(classify('rounded-lg border border-zinc-200 bg-white p-6'.split(' ')).name, 'Card', 'card identified');
  // The case the whole exercise is about: the padding moved, everything else
  // stayed. If the signature still identifies it, the violation is catchable.
  eq(classify('rounded-lg border border-zinc-200 bg-white p-4'.split(' ')).name, 'Card', 'card with tightened padding');
  eq(classify('w-full rounded-md border border-zinc-300 px-3 py-2'.split(' ')).name, 'Input', 'input beats button secondary');
  eq(classify('flex flex-col gap-4'.split(' ')), null, 'a plain stack is not a component');
  console.log('check-tailwind-patterns selftest: ok');
}

const args = process.argv.slice(2);
if (args[0] === '--selftest') {
  selftest();
} else if (args.length === 0) {
  console.error('Usage: check-tailwind-patterns.mjs <files...>  |  --selftest');
  process.exit(2);
} else {
  let totalMatched = 0;
  let totalViolations = 0;
  for (const file of args) {
    const { matched, violations } = check(file);
    totalMatched += matched;
    totalViolations += violations.length;
    if (violations.length === 0) {
      console.log(`${file}  clean  (${matched} patterns identified)`);
      continue;
    }
    console.log(`${file}  ${violations.length} violations of rule 3  (${matched} patterns identified)`);
    for (const v of violations) {
      console.log(`  ${v.name} is missing ${v.missing.join(' ')}`);
      console.log(`    ${v.classes}`);
    }
  }
  console.log(`\n${totalViolations} rule 3 violations across ${totalMatched} identified patterns in ${args.length} files.`);
}
