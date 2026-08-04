#!/usr/bin/env node
// canon-lint - mechanical validation of Canon CSS rules in HTML/JSX files.
// Zero dependencies. Usage: canon-lint <files|dirs...>
// Exit 0 = clean, 1 = violations, 2 = usage error.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { VOCAB, ELEMENTS } from './vocab.mjs';

const EXTS = new Set(['.html', '.htm', '.jsx', '.tsx', '.css']);
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

// Colours and spacing are what a theme is made of. A length in a border or a
// radius is not worth a rule; a hardcoded colour or a hardcoded gap is exactly
// the drift the tokens exist to prevent.
const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/;
const SPACING_PROP = /^\s*(padding|margin|gap|row-gap|column-gap|font-size)[^:]*:\s*([^;}]+)/;

/** Extracts the body of every `@layer canon.app { … }` block, with the offset
 *  each one starts at so line numbers stay real. */
function appLayers(src) {
  const out = [];
  for (const m of src.matchAll(/@layer\s+canon\.app\s*\{/g)) {
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    out.push({ body: src.slice(start, i - 1), offset: start });
  }
  return out;
}

function lintCss(file, src) {
  const violations = [];
  let rules = 0;
  for (const layer of appLayers(src)) {
    rules += (layer.body.match(/\{/g) ?? []).length;
    for (const line of layer.body.split('\n')) {
      const at = layer.offset + layer.body.indexOf(line);
      if (RAW_COLOUR.test(line)) {
        violations.push([lineOf(src, at), 'R6', `hardcoded colour in @layer canon.app - use a --color-* token`]);
        continue;
      }
      const spacing = line.match(SPACING_PROP);
      if (spacing && !spacing[2].includes('var(') && /\d/.test(spacing[2]) && !/^\s*0\w*\s*$/.test(spacing[2])) {
        violations.push([lineOf(src, at), 'R6', `hardcoded ${spacing[1]} in @layer canon.app - use a --space-* or --text-* token`]);
      }
    }
  }
  return { violations, rules };
}

function lintFile(file) {
  const raw = readFileSync(file, 'utf-8');
  const violations = [];
  // Coverage: how many vocabulary values this run actually read. A JSX
  // expression is opaque, so "clean" on a React codebase is a narrower claim
  // than "clean" on HTML, and the tool has to say so instead of implying it
  // checked everything.
  let checked = 0;
  let opaque = 0;
  if (extname(file) === '.css') {
    const css = lintCss(file, raw);
    return { violations: css.violations, checked: 0, opaque: 0, appRules: css.rules };
  }
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
        if (value === '{expr}') {
          opaque++;
        } else {
          checked++;
          if (!allowed.has(value)) {
            violations.push([line, 'R1', `${name}="${value}" is not in the vocabulary (${[...allowed].join('|')})`]);
          }
        }
      }
    }
  }

  return { violations, checked, opaque, appRules: 0 };
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
let checked = 0;
let opaque = 0;
let appRules = 0;
for (const file of files) {
  const result = lintFile(file);
  checked += result.checked;
  opaque += result.opaque;
  appRules += result.appRules ?? 0;
  for (const [line, rule, msg] of result.violations) {
    console.log(`${file}:${line}  ${rule}  ${msg}`);
    total++;
  }
}

// Always print coverage, not just on success: a run that found 2 violations
// while unable to read a third of the values has not found all of them.
function escapeHatch() {
  if (appRules === 0) return '';
  // Reported, never failed on its own. The app layer is a supported door, and
  // how wide it is open is the useful number: it measures what the vocabulary
  // is missing for this codebase.
  return `
  ${appRules} rule${appRules === 1 ? '' : 's'} in @layer canon.app. That is what the vocabulary does not cover here.`;
}

function coverage() {
  if (opaque === 0) return '';
  const pct = Math.round((checked / (checked + opaque)) * 100);
  return (
    `\n  ${opaque} value${opaque === 1 ? '' : 's'} written as JSX expressions could not be read.` +
    `\n  Coverage: ${pct}% of ${checked + opaque} vocabulary values.`
  );
}

if (total > 0) {
  console.error(`\n✗ ${total} violation${total === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}${coverage()}${escapeHatch()}`);
  process.exit(1);
}
console.log(`✓ ${files.length} file${files.length === 1 ? '' : 's'} clean${coverage()}${escapeHatch()}`);
