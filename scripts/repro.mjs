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

// ── Framework-neutral comparison ────────────────────────────────────────────
// Canon cannot be compared to Tailwind with the metric above: it counts
// data-* values against class lists, and Tailwind emits far more tokens per
// element, so a sequence ratio would punish it for verbosity alone. That would
// be rigging the control.
//
// These two measures do not depend on the styling system:
//   tags   the sequence of elements. Does the page skeleton come out the same?
//   style  the SET of distinct styling decisions, compared by Jaccard.
//          Set overlap is normalised by vocabulary size, not by how many
//          tokens each system needs to say the same thing.

const IGNORED_TAGS = new Set(['html', 'head', 'meta', 'link', 'title', 'script', 'style', 'body', 'br']);

/** Every styling decision in the file, with repeats kept. The set form below
 *  answers "which vocabulary did it use"; this answers "how many decisions are
 *  written down", which is the one churn needs: rewriting forty `py-6` into
 *  forty `py-4` is forty edits, not one. */
export function styleTokens(source) {
  const out = [];
  for (const m of source.matchAll(/\bdata-([a-z]+)="([^"]*)"/g)) {
    if (m[1] !== 'theme') out.push(`${m[1]}=${m[2]}`);
  }
  for (const m of source.matchAll(/\bclass="([^"]*)"/g)) {
    for (const cls of m[1].split(/\s+/)) if (cls) out.push(cls);
  }
  return out;
}

export function neutral(source) {
  const tags = [];
  for (const m of source.matchAll(/<([a-z][a-z0-9]*)\b/g)) {
    if (!IGNORED_TAGS.has(m[1])) tags.push(m[1]);
  }
  return { tags, style: new Set(styleTokens(source)) };
}

export function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let shared = 0;
  for (const v of a) if (b.has(v)) shared++;
  return shared / (a.size + b.size - shared);
}

function runNeutral(files) {
  const parsed = files.map((f) => ({ name: f, ...neutral(readFileSync(f, 'utf-8')) }));
  const tagScores = [];
  const styleScores = [];
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      tagScores.push(similarity(parsed[i].tags, parsed[j].tags));
      styleScores.push(jaccard(parsed[i].style, parsed[j].style));
    }
  }
  const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const vocab = parsed.map((p) => p.style.size);
  console.log(`${files.length} files, ${tagScores.length} pairs`);
  console.log(`  element sequence   ${pct(avg(tagScores))}`);
  console.log(`  styling vocabulary ${pct(avg(styleScores))}  (Jaccard over distinct decisions)`);
  console.log(`  distinct decisions per file: ${vocab.join(', ')}`);
}

// ── Churn: how much of a page an edit rewrites ──────────────────────────────
// Reproduction measures generating the same page twice. It says nothing about
// the operation a codebase actually spends its life in: changing a page that
// already exists. A closed vocabulary should win here by construction rather
// than by prompt strictness, because the styling lives in a few enumerated
// values instead of on every element. Should. That is what this measures.
//
// Two numbers:
//   decisions  multiset difference over styling tokens, reported as a COUNT.
//              Changing forty `py-6` into forty `py-4` is forty edits, not one,
//              so repeats are kept.
//   lines      changed lines over base lines. The closest thing to what a
//              reviewer actually reads in the diff.
//
// The decision count is deliberately not a percentage across systems, and an
// earlier version of this tool got that wrong. Dividing by the base file's own
// token count divides by a number that differs about fourfold between a closed
// vocabulary and a utility system, so the more verbose system scores better for
// being more verbose: 8 edits out of 391 reads as 4% while 3 edits out of 104
// reads as 6%. The percentage is still printed, because within one system it
// answers "how much of this page did the change disturb", but it is the count
// and the line figure that are comparable across systems.

function multisetDiff(a, b) {
  const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
  const ca = count(a);
  const cb = count(b);
  let added = 0;
  let removed = 0;
  for (const k of new Set([...ca.keys(), ...cb.keys()])) {
    const d = (cb.get(k) ?? 0) - (ca.get(k) ?? 0);
    if (d > 0) added += d;
    else removed += -d;
  }
  return { added, removed };
}

/** Changed lines between two files, via the same subsequence logic as above:
 *  an inserted block should cost its own length, not realign the rest. */
export function lineChurn(a, b) {
  const la = a.split('\n').map((l) => l.trim()).filter(Boolean);
  const lb = b.split('\n').map((l) => l.trim()).filter(Boolean);
  const shared = lcs(la, lb);
  return { changed: la.length + lb.length - 2 * shared, baseLines: la.length };
}

function runChurn(baseFile, editedFiles) {
  const base = readFileSync(baseFile, 'utf-8');
  const baseTokens = styleTokens(base);
  console.log(`base: ${baseFile}  (${baseTokens.length} styling decisions, ${lineChurn(base, base).baseLines} lines)`);

  const rows = editedFiles.map((f) => {
    const edited = readFileSync(f, 'utf-8');
    const { added, removed } = multisetDiff(baseTokens, styleTokens(edited));
    const { changed, baseLines } = lineChurn(base, edited);
    return { f, touched: added + removed, added, removed, changed, baseLines };
  });

  for (const r of rows) {
    console.log(`\n${r.f}`);
    // Added and removed stay separate. Summing them double-counts a
    // modification, where one changed value shows up as both a removal and an
    // addition, while an insertion or a deletion only lands on one side.
    console.log(`  decisions            +${r.added} / -${r.removed}  (${pct(r.touched / baseTokens.length)} of this file)`);
    console.log(`  lines changed        ${pct(r.changed / r.baseLines)}  (${r.changed} of ${r.baseLines})`);
  }

  const avg = (k) => rows.reduce((s, r) => s + r[k], 0) / rows.length;
  console.log(
    `\nmean over ${rows.length} edits:  +${avg('added').toFixed(1)} / -${avg('removed').toFixed(1)} decisions  ${pct(avg('changed') / rows[0].baseLines)} lines`,
  );
  console.log('Compare the decision COUNT across systems, not the percentage: the percentage divides by a base that differs about fourfold between them.');
}

/** Which modifiers actually disagree, ranked. Sequence similarity punishes a
 *  generation for writing more copy than another: eight subtle spans against
 *  thirteen scores as drift when it is really verbosity. This separates the
 *  two, so a low modifier score can be read rather than guessed at. */
function why(parsed) {
  const tally = parsed.map((p) => {
    const m = new Map();
    for (const v of p.modifiers) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  });
  const keys = [...new Set(tally.flatMap((m) => [...m.keys()]))];
  const rows = keys
    .map((k) => {
      const counts = tally.map((m) => m.get(k) ?? 0);
      return { k, counts, spread: Math.max(...counts) - Math.min(...counts) };
    })
    .filter((r) => r.spread > 0)
    .sort((a, b) => b.spread - a.spread);

  if (rows.length === 0) {
    console.log('\nEvery modifier is used the same number of times in every file.');
    return;
  }
  console.log('\nModifiers that disagree, worst first:');
  for (const r of rows.slice(0, 10)) {
    console.log(`  ${r.k.padEnd(24)} [${r.counts.join(', ')}]  spread ${r.spread}`);
  }
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

  const n = neutral('<header class="flex gap-4"><a data-tone="subtle">x</a></header>');
  eq(n.tags, ['header', 'a'], 'neutral tag extraction');
  eq([...n.style].sort(), ['flex', 'gap-4', 'tone=subtle'], 'neutral style extraction');
  eq(jaccard(new Set(['a', 'b']), new Set(['a', 'b'])), 1, 'jaccard identical');
  eq(jaccard(new Set(['a']), new Set(['b'])), 0, 'jaccard disjoint');
  eq(jaccard(new Set(['a', 'b']), new Set(['b', 'c'])), 1 / 3, 'jaccard partial');
  eq(jaccard(new Set(), new Set()), 1, 'jaccard both empty');

  // Churn keeps repeats: forty identical edits must count forty, or the whole
  // measure collapses to "did the vocabulary change at all", which is not it.
  eq(styleTokens('<a class="p-2"><b class="p-2">'), ['p-2', 'p-2'], 'style tokens keep repeats');
  eq(lineChurn('a\nb\nc', 'a\nb\nc').changed, 0, 'line churn of a file against itself');
  eq(lineChurn('a\nb', 'a\nb\nc').changed, 1, 'line churn of one insertion');

  console.log('repro selftest: ok');
}

const args = process.argv.slice(2);
if (args[0] === '--selftest') {
  selftest();
} else if (args[0] === '--neutral') {
  const files = args.slice(1);
  if (files.length < 2) {
    console.error('Usage: repro.mjs --neutral <fileA> <fileB> [...]');
    process.exit(2);
  }
  runNeutral(files);
} else if (args[0] === '--churn') {
  const [base, ...edited] = args.slice(1);
  if (!base || edited.length === 0) {
    console.error('Usage: repro.mjs --churn <base> <edited> [...]');
    process.exit(2);
  }
  runChurn(base, edited);
} else if (args.length < 2) {
  console.error('Usage: repro.mjs <fileA> <fileB> [...]  |  repro.mjs --neutral <files>  |  repro.mjs --churn <base> <edited...>  |  repro.mjs --selftest');
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
    why(parsed);
  }

  if (totalOpaque > 0) {
    console.log(
      `\nnote: ${totalOpaque} of ${totalValues} values are JSX expressions and cannot be compared. ` +
        `Scores cover ${pct(1 - totalOpaque / totalValues)} of the markup.`,
    );
  }
}
