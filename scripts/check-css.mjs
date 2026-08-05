#!/usr/bin/env node
// The shipped CSS is the one artifact nothing was checking. `npm test` linted
// the HTML corpus, the themes and the app layers, and would pass with exit 0 on
// a dist/canon.css containing `color: ;;;` - measured, not assumed. A single
// broken declaration takes the rest of its block with it, so the failure mode
// is a component that silently stops existing on every page that ships it.
//
// Four checks, each one a class of bug that valid-looking CSS can hide:
//
//   C1  the file parses: braces, parens, brackets, strings and comments all
//       balanced and terminated. Catches truncation and the stray `}` that
//       concatenating five files invites.
//   C2  every declaration has a property and a non-empty value.
//   C3  every var(--x) resolves to a token defined somewhere in the file set,
//       or carries a fallback. This is R7 one level down: a misspelled token in
//       Canon's own source is valid CSS that renders nothing.
//   C4  every @layer block sits inside the declared layer order. A layer name
//       that is not in the @layer statement still works, but it sorts last
//       instead of where it was meant to, which is how a theme's :root came to
//       beat Canon's [data-theme="dark"].
//
// ponytail: a hand-rolled 100-line scanner instead of a CSS parser dependency.
// Canon ships zero dependencies on purpose and this file set has no url(), no
// data URIs and no @supports nesting games. If that stops being true, swap in
// postcss and delete the scanner.

import { readFileSync } from 'node:fs';

const FILES = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const SELFTEST = process.argv.includes('--selftest');

// Strip comments and string bodies, preserving newlines and byte offsets so
// that every later check still reports the right line. Unterminated ones are
// errors in their own right.
function strip(css, errs, file) {
  let out = '';
  let i = 0;
  let line = 1;
  while (i < css.length) {
    const c = css[i];
    if (c === '\n') line++;
    if (c === '/' && css[i + 1] === '*') {
      const start = line;
      const end = css.indexOf('*/', i + 2);
      if (end === -1) {
        errs.push([file, start, 'C1', 'unterminated comment']);
        return out;
      }
      const chunk = css.slice(i, end + 2);
      for (const ch of chunk) if (ch === '\n') out += '\n';
      line += (chunk.match(/\n/g) || []).length;
      i = end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const start = line;
      let j = i + 1;
      while (j < css.length && css[j] !== c) {
        if (css[j] === '\\') j++;
        else if (css[j] === '\n') break;
        j++;
      }
      if (css[j] !== c) {
        errs.push([file, start, 'C1', `unterminated ${c === '"' ? 'double' : 'single'}-quoted string`]);
        return out;
      }
      // Keep the quotes and the length, neutralise the body. `content: ""` is a
      // real value, so blanking the whole token would read as an empty one.
      out += c + 'x'.repeat(j - i - 1) + c;
      i = j + 1;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

const CLOSERS = { '{': '}', '(': ')', '[': ']' };

// A declaration is `prop: value`. Custom properties may legally hold an empty
// value, so only real properties are required to say something.
function checkDecl(text, file, line, errs) {
  const t = text.trim();
  if (!t || t.startsWith('@')) return;
  const colon = t.indexOf(':');
  if (colon === -1) {
    errs.push([file, line, 'C2', `declaration with no colon: ${t.slice(0, 40)}`]);
    return;
  }
  const prop = t.slice(0, colon).trim();
  const value = t.slice(colon + 1).trim();
  if (!/^(--[\w-]+|[-a-zA-Z][\w-]*)$/.test(prop)) {
    errs.push([file, line, 'C2', `not a property name: ${prop.slice(0, 40)}`]);
    return;
  }
  if (!value && !prop.startsWith('--')) {
    errs.push([file, line, 'C2', `empty value for ${prop}`]);
  }
}

function scan(css, file, errs) {
  const src = strip(css, errs, file);
  const stack = [];
  let buf = '';
  let bufLine = 1;
  let line = 1;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\n') line++;
    if (!buf.trim()) bufLine = line;

    if (c === '(' || c === '[') {
      stack.push([c, line]);
      buf += c;
    } else if (c === ')' || c === ']') {
      const open = stack.pop();
      if (!open || CLOSERS[open[0]] !== c) {
        errs.push([file, line, 'C1', `unexpected \`${c}\``]);
        return;
      }
      buf += c;
    } else if (c === '{') {
      // Inside parens a brace is not a block (nothing here does that, but be
      // honest about it rather than mis-parsing).
      if (stack.some(([ch]) => ch !== '{')) {
        buf += c;
        continue;
      }
      if (!buf.trim()) errs.push([file, line, 'C1', 'block with no selector']);
      stack.push(['{', line]);
      buf = '';
    } else if (c === '}') {
      if (stack.some(([ch]) => ch !== '{')) {
        buf += c;
        continue;
      }
      const open = stack.pop();
      if (!open || open[0] !== '{') {
        errs.push([file, line, 'C1', 'unexpected `}`']);
        return;
      }
      checkDecl(buf, file, bufLine, errs);
      buf = '';
    } else if (c === ';' && stack.length && stack[stack.length - 1][0] === '{') {
      checkDecl(buf, file, bufLine, errs);
      buf = '';
    } else if (c === ';') {
      buf = '';
    } else {
      buf += c;
    }
  }

  for (const [ch, at] of stack) {
    errs.push([file, at, 'C1', `unclosed \`${ch}\``]);
  }
}

// sources: [file, css] pairs. Taken as data rather than as paths so the
// selftest exercises the same code the build gate runs.
function run(sources) {
  const errs = [];

  for (const [file, css] of sources) scan(css, file, errs);

  // C3 and C4 look across the whole set: a theme defines tokens Canon uses and
  // Canon declares the layer order a theme sits in, so neither file is
  // judgeable alone.
  const defined = new Set();
  const declaredLayers = new Set();
  for (const [, css] of sources) {
    const bare = strip(css, [], '');
    for (const m of bare.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
    for (const m of bare.matchAll(/@layer\s+([^{;]+);/g)) {
      for (const name of m[1].split(',')) declaredLayers.add(name.trim());
    }
  }

  for (const [file, css] of sources) {
    const bare = strip(css, [], '');
    const lineAt = (idx) => bare.slice(0, idx).split('\n').length;

    for (const m of bare.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
      if (m[2] === ',') continue; // has a fallback, cannot render nothing
      if (!defined.has(m[1])) {
        errs.push([file, lineAt(m.index), 'C3', `var(${m[1]}) is defined nowhere`]);
      }
    }

    for (const m of bare.matchAll(/@layer\s+([\w.-]+)\s*\{/g)) {
      if (!declaredLayers.has(m[1])) {
        errs.push([file, lineAt(m.index), 'C4', `@layer ${m[1]} is outside the declared layer order`]);
      }
    }
  }

  return errs;
}

function report(errs) {
  for (const [file, line, rule, msg] of errs) {
    console.log(`  ${file}:${line}  ${rule}  ${msg}`);
  }
}

if (SELFTEST) {
  const cases = [
    ['a { color: red }', 0],
    ['a { color: ;;; }', 1],
    ['a { color: red', 1],
    ['a { color: red } }', 1],
    ['a { /* open', 1],
    ['a { content: "x }', 1],
    ['a { color red }', 1],
    ['a { --empty: ; }', 0],
    ['a { color: var(--nope) }', 1],
    ['a { color: var(--nope, red) }', 0],
    ['@layer x; @layer x { a { color: red } }', 0],
    ['@layer x; @layer y { a { color: red } }', 1],
    ['a { transform: translate(1px, 2px) }', 0],
    ['@media (min-width: 1px) { a { color: red } }', 0],
    ['[data-x="a;b"] { color: red }', 0],
    ['a::after { content: "" }', 0],
    ['a::after { content: "}" }', 0],
  ];
  let bad = 0;
  for (const [css, want] of cases) {
    const errs = run([['<case>', css]]);
    if ((want === 0) !== (errs.length === 0)) {
      console.log(`FAIL: ${JSON.stringify(css)} wanted ${want ? 'error' : 'clean'}, got ${errs.length}`);
      report(errs);
      bad++;
    }
  }
  if (bad) process.exit(1);
  console.log('check-css selftest: ok');
  process.exit(0);
}

if (!FILES.length) {
  console.error('usage: check-css.mjs <file.css...> | --selftest');
  process.exit(2);
}

const errs = run(FILES.map((f) => [f, readFileSync(f, 'utf8')]));
if (errs.length) {
  console.log(`\n✗ ${errs.length} CSS integrity error${errs.length === 1 ? '' : 's'}`);
  report(errs);
  process.exit(1);
}
console.log(`✓ ${FILES.length} CSS file${FILES.length === 1 ? '' : 's'} parse clean`);
