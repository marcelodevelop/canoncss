#!/usr/bin/env node
// repro - measures how reproducible Canon markup is across generations.
//
// Give it two or more files generated from the same spec and it reports how
// much of the markup they share, split into two layers:
//
//   structure  data-layout, data-component, data-slot. The skeleton. This is
//              what the closed-vocabulary thesis actually claims.
//   modifiers  data-gap, data-align, data-variant and friends. Cosmetics.
//              Drift here changes how a page looks, not what it is.
//
// The split matters: a run can score 96% structure and 76% modifiers, and that
// is a good result, not a mixed one. Reporting one blended number would hide it.
//
// Usage:  node scripts/repro.mjs <fileA> <fileB> [fileC ...]
//         node scripts/repro.mjs --selftest
// Exit 0 always: this measures, it does not judge. Thresholds are a human call.

import { readFileSync } from 'node:fs';

const STRUCTURE = ['layout', 'component', 'slot'];
const MODIFIER = ['gap', 'align', 'justify', 'variant', 'size', 'state', 'tone', 'cols', 'width', 'padding', 'motion', 'hide'];

// Captures data-x="literal" and data-x={expression} alike. An expression is
// kept as a distinct opaque token: two generations that both wrote {expr} did
// not necessarily write the same thing, and pretending otherwise inflates the
// score.
const ATTR = /data-([a-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{)/g;

export function extract(source) {
  const structure = [];
  const modifiers = [];
  let opaque = 0;
  for (const m of source.matchAll(ATTR)) {
    const name = m[1];
    const literal = m[2] ?? m[3];
    const value = literal ?? '{expr}';
    if (literal === undefined) opaque++;
    if (STRUCTURE.includes(name)) structure.push(`${name}:${value}`);
    else if (MODIFIER.includes(name)) modifiers.push(`${name}:${value}`);
  }
  return { structure, modifiers, opaque };
}

/** Longest common subsequence length. Order matters, position does not: an
 *  inserted wrapper should cost one point, not shift every later element. */
export function lcs(a, b) {
  const prev = new Array(b.length + 1).fill(0);
  const curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], curr[j - 1]);
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length];
}

/** Dice coefficient over the common subsequence: 1 when identical, 0 when
 *  nothing is shared. Two empty sequences count as identical, not as 0/0. */
export function similarity(a, b) {
  if (a.length === 0 && b.length === 0) return 1;
  return (2 * lcs(a, b)) / (a.length + b.length);
}

function pct(n) {
  return `${Math.round(n * 100)}%`;
}

function compare(nameA, a, nameB, b) {
  const s = similarity(a.structure, b.structure);
  const m = similarity(a.modifiers, b.modifiers);
  console.log(`\n${nameA}\n${nameB}`);
  console.log(`  structure  ${pct(s)}  (${a.structure.length} vs ${b.structure.length} decisions)`);
  console.log(`  modifiers  ${pct(m)}  (${a.modifiers.length} vs ${b.modifiers.length} decisions)`);

  const onlyA = a.structure.filter((x) => !b.structure.includes(x));
  const onlyB = b.structure.filter((x) => !a.structure.includes(x));
  if (onlyA.length) console.log(`  only in first   ${[...new Set(onlyA)].join(', ')}`);
  if (onlyB.length) console.log(`  only in second  ${[...new Set(onlyB)].join(', ')}`);
  return { s, m };
}

function selftest() {
  const eq = (got, want, label) => {
    const a = JSON.stringify(got);
    const b = JSON.stringify(want);
    if (a !== b) throw new Error(`${label}: got ${a}, want ${b}`);
  };

  eq(lcs(['a', 'b', 'c'], ['a', 'b', 'c']), 3, 'lcs identical');
  eq(lcs(['a', 'b'], ['x', 'y']), 0, 'lcs disjoint');
  // The insertion case this tool exists for: one extra wrapper must cost one
  // point, not realign every element after it.
  eq(lcs(['a', 'b', 'c'], ['z', 'a', 'b', 'c']), 3, 'lcs single insertion');
  eq(similarity([], []), 1, 'similarity of two empty sequences');
  eq(similarity(['a'], []), 0, 'similarity against empty');

  const got = extract('<div data-layout="stack" data-gap="md"><span data-variant={x}></span></div>');
  eq(got.structure, ['layout:stack'], 'structure extraction');
  eq(got.modifiers, ['gap:md', 'variant:{expr}'], 'modifier extraction');
  eq(got.opaque, 1, 'opaque count');

  // A JSX expression must never match another expression: both are unknown.
  const a = extract('<b data-variant={x}>');
  const b = extract('<b data-variant={y}>');
  eq(similarity(a.modifiers, b.modifiers) === 1, true, 'expressions compare as equal tokens');

  console.log('repro selftest: ok');
}

const args = process.argv.slice(2);
if (args[0] === '--selftest') {
  selftest();
} else if (args.length < 2) {
  console.error('Usage: repro.mjs <fileA> <fileB> [fileC ...]  |  repro.mjs --selftest');
  process.exit(2);
} else {
  const parsed = args.map((f) => ({ name: f, ...extract(readFileSync(f, 'utf-8')) }));
  const totalOpaque = parsed.reduce((n, p) => n + p.opaque, 0);
  const totalValues = parsed.reduce((n, p) => n + p.structure.length + p.modifiers.length, 0);

  const scores = [];
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      scores.push(compare(parsed[i].name, parsed[i], parsed[j].name, parsed[j]));
    }
  }

  if (scores.length > 1) {
    const mean = (k) => scores.reduce((sum, s) => sum + s[k], 0) / scores.length;
    console.log(`\nmean over ${scores.length} pairs:  structure ${pct(mean('s'))}  modifiers ${pct(mean('m'))}`);
  }

  if (totalOpaque > 0) {
    console.log(
      `\nnote: ${totalOpaque} of ${totalValues} values are JSX expressions and cannot be compared. ` +
        `Scores cover ${pct(1 - totalOpaque / totalValues)} of the markup.`,
    );
  }
}
