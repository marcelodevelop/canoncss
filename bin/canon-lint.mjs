#!/usr/bin/env node
// canon-lint - mechanical validation of Canon CSS rules in HTML/JSX files.
// Zero dependencies. Usage: canon-lint <files|dirs...>
// Exit 0 = clean, 1 = violations, 2 = usage error.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { VOCAB, ELEMENTS } from './vocab.mjs';

const EXTS = new Set(['.html', '.htm', '.jsx', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.git']);

function collect(path, out = []) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) {
      if (!SKIP_DIRS.has(name)) collect(join(path, name), out);
    }
  } else if (EXTS.has(extname(path))) {
    out.push(path);
  }
  return out;
}

// Blanks out matches so byte offsets (and therefore line numbers) stay stable.
function blank(src, re) {
  return src.replace(re, (m) => m.replace(/[^\n]/g, ' '));
}

function lineOf(src, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (src[i] === '\n') line++;
  return line;
}

function lintFile(file) {
  const raw = readFileSync(file, 'utf-8');
  const violations = [];
  // Ignore code-sample carriers: template literals (JSX docs), comments.
  let src = raw;
  src = blank(src, /`[^`]*`/gs);
  src = blank(src, /<!--[\s\S]*?-->/g);
  src = blank(src, /\{\/\*[\s\S]*?\*\/\}/g);

  // R3 - <style> blocks
  for (const m of src.matchAll(/<style[\s>]/gi)) {
    violations.push([lineOf(src, m.index), 'R3', 'no <style> blocks - Canon markup needs no extra CSS']);
  }

  // Per-tag checks
  for (const tag of src.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)[^<>]*>/g)) {
    const text = tag[0];
    const name = tag[1];
    const line = lineOf(src, tag.index);
    const attrs = new Map();
    for (const a of text.matchAll(/([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{))/g)) {
      attrs.set(a[1], a[4] ? '{expr}' : (a[2] ?? a[3] ?? ''));
    }

    // R2 - inline styles (style="…" or JSX style={…})
    if (attrs.has('style')) {
      violations.push([line, 'R2', 'no inline styles - use tokens via data-* attributes']);
    }

    // R4 - data-layout + data-component on the same element
    if (attrs.has('data-layout') && attrs.has('data-component')) {
      violations.push([line, 'R4', 'an element gets data-layout OR data-component, never both']);
    }

    // R5 - a component role only sits on its canonical element.
    // Skipped for JSX components (<Card …>), which forward the attribute down.
    if (attrs.has('data-component') && name === name.toLowerCase()) {
      const role = attrs.get('data-component');
      const allowed = ELEMENTS[role];
      if (allowed && !allowed.has(name)) {
        violations.push([line, 'R5', `<${name} data-component="${role}"> - use ${[...allowed].map((t) => `<${t}>`).join(' or ')}`]);
      }
    }

    // R1 - closed vocabulary values
    for (const [name, allowed] of Object.entries(VOCAB)) {
      if (attrs.has(name)) {
        const value = attrs.get(name);
        if (value !== '{expr}' && !allowed.has(value)) {
          violations.push([line, 'R1', `${name}="${value}" is not in the vocabulary (${[...allowed].join('|')})`]);
        }
      }
    }
  }

  return violations;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: canon-lint <files|dirs...>');
  process.exit(2);
}

let files = [];
try {
  for (const a of args) collect(a, files);
} catch (e) {
  console.error(`canon-lint: ${e.message}`);
  process.exit(2);
}

let total = 0;
for (const file of files) {
  for (const [line, rule, msg] of lintFile(file)) {
    console.log(`${file}:${line}  ${rule}  ${msg}`);
    total++;
  }
}

if (total > 0) {
  console.error(`\n✗ ${total} violation${total === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log(`✓ ${files.length} file${files.length === 1 ? '' : 's'} clean`);
