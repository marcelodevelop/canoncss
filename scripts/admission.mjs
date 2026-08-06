#!/usr/bin/env node
// The admission test in CONTRIBUTING, as a measurement instrument.
//
// The rule says a gap qualifies when generations DIVERGE, not when they
// complain, and it asks two questions of the same set of files:
//
//   1. Did they reach for it at all?
//   2. Did they build it differently from each other?
//
// Only the second decides. If every generation reached the same construction
// without the component, the vocabulary already covers the pattern and the
// request is for a name rather than a capability. That is how `footer` was
// rejected and how `disclosure` was admitted.
//
// This script answers both mechanically. Each pattern is located by a content
// anchor the spec guaranteed would be on the page, so detection does not depend
// on the generation having used any particular markup, which is the thing being
// measured. Once located, the construction is fingerprinted as the chain of
// Canon attributes from the anchor up to its nearest structural ancestor.
//
// Written before the generations were read, so the analysis could not be shaped
// around the answer.
//
// Usage: node scripts/admission.mjs <dir> [--spec docs|tickets] [--json]

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);

/** Walks the document and calls visit(text, stack) for every text run, where
 *  stack is the open-element chain. Regex over tag soup, the same approach
 *  canon-lint takes, because the input is generated HTML and not the web. */
function walk(html, visit) {
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let last = 0;
  let m;
  while ((m = re.exec(html))) {
    const text = html.slice(last, m.index).replace(/\s+/g, ' ').trim();
    if (text) visit(text, stack);
    last = re.lastIndex;
    const [, closing, rawName, attrs, selfClose] = m;
    const name = rawName.toLowerCase();
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name) { stack.length = i; break; }
      }
    } else if (!VOID.has(name) && !selfClose) {
      stack.push({ name, attrs });
    } else {
      // A void element still carries attributes worth seeing (an <input>, an
      // <hr data-component="divider">), so show it to the visitor as a leaf.
      visit('', [...stack, { name, attrs }]);
    }
  }
}

const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`${name}=["']([^"']*)["']`));
  return m ? m[1] : null;
};

/** The Canon-visible shape of one element: its tag plus only the attributes
 *  that carry structure. Two generations that wrote the same thing produce the
 *  same string; two that reached for different constructions do not. */
function shape(el) {
  const bits = [];
  for (const a of ['data-component', 'data-layout', 'data-slot', 'data-variant', 'data-x-component']) {
    const v = attr(el.attrs, a);
    if (v) bits.push(`${a.replace('data-', '')}=${v}`);
  }
  if (/aria-current/.test(el.attrs)) bits.push('aria-current');
  if (/role=/.test(el.attrs)) bits.push(`role=${attr(el.attrs, 'role')}`);
  return el.name + (bits.length ? `[${bits.join(' ')}]` : '');
}

/** The construction: the anchor's nearest three structural ancestors, outermost
 *  first. Deeper than that is page chrome and shared by everyone. */
function construction(stack) {
  const meaningful = stack.filter(
    (el) => /data-(component|layout|slot|x-component)=/.test(el.attrs) ||
      ['nav', 'ol', 'ul', 'li', 'aside', 'section', 'table'].includes(el.name)
  );
  return meaningful.slice(-3).map(shape).join(' > ') || stack.slice(-2).map(shape).join(' > ');
}

// Each pattern gets a detector and a rule for which hit counts.
//
// `first` matters for the notice: the FAQ answers also mention the retirement,
// and taking the most common hit made a page's FAQ outvote its actual banner.
// The banner is the one at the top, so the first hit in document order is it.
//
// The trail cannot be found by link text at all, because a sidebar nav on a
// docs site contains the same words as the breadcrumb above it. What makes a
// breadcrumb a breadcrumb is the separator between the links, or the author
// saying so in aria-label, so that is what is matched.
const SEPARATOR = /^[/›»>|\\·—–-]$/;

const SPECS = {
  docs: {
    notice: { text: (t) => /(retir|deprecat|sunset).{0,80}(1 march|2027|v3)|v3\/shipments/i.test(t), pick: 'first' },
    trail: { sep: true, pick: 'first' },
    pager: { text: (t) => /^(next|previous|prev|next page|previous page|older|newer)\b/i.test(t), pick: 'mode' },
  },
  tickets: {
    notice: { text: (t) => /(90 days|15 september).{0,80}(delet|remov)|permanently delet/i.test(t), pick: 'first' },
    trail: { sep: true, pick: 'first' },
    pager: { text: (t) => /^(next|previous|prev|\d{1,3})$/i.test(t), pick: 'mode' },
  },
};

const dir = process.argv[2];
const specName = (process.argv.includes('--spec') && process.argv[process.argv.indexOf('--spec') + 1]) || 'docs';
const spec = SPECS[specName];
if (!dir || !spec) {
  console.error('usage: admission.mjs <dir> [--spec docs|tickets] [--json]');
  process.exit(2);
}

const files = readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
const results = {};

for (const pattern of ['notice', 'trail', 'pager']) results[pattern] = new Map();

for (const file of files) {
  const html = readFileSync(join(dir, file), 'utf-8');
  const hits = { notice: [], trail: [], pager: [] };
  walk(html, (text, stack) => {
    if (!text) return;
    for (const pattern of ['notice', 'trail', 'pager']) {
      const def = spec[pattern];
      const matched = def.sep
        ? SEPARATOR.test(text) || stack.some((el) => /aria-label=["'][^"']*readcrumb/i.test(el.attrs))
        : def.text(text);
      if (matched) hits[pattern].push(construction(stack));
    }
  });
  for (const pattern of ['notice', 'trail', 'pager']) {
    // One construction per file per pattern. `first` for things that appear
    // once at the top of the page, `mode` for things that repeat by nature, so
    // six pager links count as one construction.
    let sig = null;
    if (hits[pattern].length) {
      if (spec[pattern].pick === 'first') {
        sig = hits[pattern][0];
      } else {
        const counts = new Map();
        for (const c of hits[pattern]) counts.set(c, (counts.get(c) ?? 0) + 1);
        sig = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
    }
    if (!results[pattern].has(sig)) results[pattern].set(sig, []);
    results[pattern].get(sig).push(file);
  }
}

const LABEL = { notice: 'a block-level notice (alert)', trail: 'where am I (breadcrumb)', pager: 'move through pages (pagination)' };

if (process.argv.includes('--json')) {
  const out = {};
  for (const p of ['notice', 'trail', 'pager']) {
    out[p] = [...results[p]].map(([sig, fs]) => ({ construction: sig, files: fs }));
  }
  console.log(JSON.stringify({ spec: specName, files: files.length, patterns: out }, null, 2));
  process.exit(0);
}

console.log(`\nAdmission test: ${specName}, ${files.length} clean-context generations\n`);
for (const pattern of ['notice', 'trail', 'pager']) {
  const groups = [...results[pattern]];
  const missing = groups.find(([sig]) => sig === null);
  const built = groups.filter(([sig]) => sig !== null);
  const reached = files.length - (missing ? missing[1].length : 0);
  console.log(`${LABEL[pattern]}`);
  console.log(`  reached for it:      ${reached} of ${files.length}`);
  console.log(`  distinct constructions: ${built.length}`);
  for (const [sig, fs] of built.sort((a, b) => b[1].length - a[1].length)) {
    console.log(`    ${String(fs.length).padStart(2)}x  ${sig}`);
  }
  if (missing) console.log(`     ${String(missing[1].length).padStart(1)}x  (did not build it): ${missing[1].join(', ')}`);
  // The verdict the rule actually specifies.
  const verdict = built.length <= 1
    ? 'REJECT: one construction, so the vocabulary already answers this'
    : `ADMIT: ${built.length} incompatible constructions`;
  console.log(`  ${verdict}\n`);
}
