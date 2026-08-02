#!/usr/bin/env node
// canon-lint — mechanical validation of Canon CSS rules in HTML/JSX files.
// Zero dependencies. Usage: canon-lint <files|dirs...>
// Exit 0 = clean, 1 = violations, 2 = usage error.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const LAYOUTS = new Set(['stack', 'row', 'grid', 'sidebar', 'centered', 'hero', 'split']);
const COMPONENTS = new Set(['button', 'card', 'badge', 'input', 'textarea', 'select', 'topbar', 'modal', 'avatar', 'table', 'divider']);
const SCALE = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);
const VOCAB = {
  'data-layout': LAYOUTS,
  'data-component': COMPONENTS,
  'data-gap': SCALE,
  'data-padding': SCALE,
  'data-align': new Set(['start', 'center', 'end', 'stretch']),
  'data-justify': new Set(['start', 'center', 'end', 'between', 'around']),
  'data-cols': new Set(['1', '2', '3', '4', 'auto']),
  'data-width': new Set(['prose', 'content', 'wide']),
  'data-size': new Set(['sm', 'md', 'lg']),
  // ponytail: unión de variants de todos los componentes; per-component si hace falta
  'data-variant': new Set(['primary', 'secondary', 'ghost', 'danger', 'link', 'neutral', 'brand', 'success', 'warning', 'error', 'info', 'strong', 'featured']),
  'data-state': new Set(['error', 'success']),
  'data-tone': new Set(['subtle', 'brand', 'success', 'error']),
  'data-slot': new Set(['header', 'body', 'footer', 'sidebar', 'main', 'brand', 'nav', 'actions', 'panel']),
  'data-theme': new Set(['dark', 'light']),
};

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

  // R3 — <style> blocks
  for (const m of src.matchAll(/<style[\s>]/gi)) {
    violations.push([lineOf(src, m.index), 'R3', 'no <style> blocks — Canon markup needs no extra CSS']);
  }

  // Per-tag checks
  for (const tag of src.matchAll(/<[a-zA-Z][^<>]*>/g)) {
    const text = tag[0];
    const line = lineOf(src, tag.index);
    const attrs = new Map();
    for (const a of text.matchAll(/([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{))/g)) {
      attrs.set(a[1], a[4] ? '{expr}' : (a[2] ?? a[3] ?? ''));
    }

    // R2 — inline styles (style="…" or JSX style={…})
    if (attrs.has('style')) {
      violations.push([line, 'R2', 'no inline styles — use tokens via data-* attributes']);
    }

    // R4 — data-layout + data-component on the same element
    if (attrs.has('data-layout') && attrs.has('data-component')) {
      violations.push([line, 'R4', 'an element gets data-layout OR data-component, never both']);
    }

    // R1 — closed vocabulary values
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
