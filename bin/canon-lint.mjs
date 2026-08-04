#!/usr/bin/env node
// canon-lint - mechanical validation of Canon CSS rules in HTML/JSX files.
// Zero dependencies. Usage: canon-lint <files|dirs...>
// Exit 0 = clean, 1 = violations, 2 = usage error.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { VOCAB, ELEMENTS, COMPONENTS } from './vocab.mjs';
import { TOKENS } from './tokens.mjs';

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

/** Levenshtein distance, iterative and small. Only used to turn a typo into a
 *  useful suggestion, so a bad guess is worse than none and the caller drops
 *  anything that is not close. */
function distance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let corner = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, corner + (a[i - 1] === b[j - 1] ? 0 : 1));
      corner = above;
    }
  }
  return prev[b.length];
}

function closest(name) {
  let best = null;
  let bestDistance = Infinity;
  for (const token of TOKENS) {
    const d = distance(name, token);
    if (d < bestDistance) {
      bestDistance = d;
      best = token;
    }
  }
  // Three edits away is not a typo, it is a different idea.
  return bestDistance <= 3 ? best : null;
}

/** R7 - a custom property that overrides nothing.
 *  A misspelled token is valid CSS and silently does nothing, so the page
 *  comes out almost right and the cause is invisible. Only definitions that
 *  look like Canon tokens are judged: a project's own --my-* properties are
 *  its business. */
function lintTokens(src) {
  const violations = [];
  let overrides = 0;
  for (const m of src.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)) {
    const name = m[1];
    if (TOKENS.has(name)) {
      overrides++;
      continue;
    }
    // Only flag names that sit in Canon's namespaces. Anything else is the
    // consumer's own variable and none of this tool's business.
    const prefix = name.split('-')[2];
    if (!prefix) continue;
    const family = `--${name.split('-')[2]}`;
    const looksCanon = [...TOKENS].some((t) => t.startsWith(family + '-') || t === family);
    if (looksCanon) {
      const best = closest(name);
      violations.push([
        lineOf(src, m.index),
        'R7',
        `${name} is not a Canon token and overrides nothing${best ? `. Did you mean ${best}?` : ''}`,
      ]);
    }
  }
  return { violations, overrides };
}

/** Extension components declared in an app layer, as `[data-x-component="x"]`
 *  selectors. Collected across every file so markup can be checked against
 *  what the CSS actually defines. */
const declaredExtensions = new Set();
const usedExtensions = new Map();

function lintCss(file, src) {
  const violations = [];
  let rules = 0;
  for (const layer of appLayers(src)) {
    rules += (layer.body.match(/\{/g) ?? []).length;
    for (const m of layer.body.matchAll(/\[data-x-component=["']([a-z0-9-]+)["']\]/g)) {
      declaredExtensions.add(m[1]);
    }
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
  const tokens = lintTokens(src);
  violations.push(...tokens.violations);
  return { violations, rules, overrides: tokens.overrides };
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
    return { violations: css.violations, checked: 0, opaque: 0, appRules: css.rules, overrides: css.overrides };
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

    // R8 - extension components. The closed vocabulary stays closed, so
    // anything Canon does not have takes the data-x- namespace instead of
    // squatting on data-component. Kebab-case, and it has to be styled
    // somewhere or the element renders bare.
    if (attrs.has('data-x-component')) {
      const value = attrs.get('data-x-component');
      if (value !== '{expr}') {
        if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value)) {
          violations.push([line, 'R8', `data-x-component="${value}" should be kebab-case`]);
        } else if (COMPONENTS.has(value)) {
          violations.push([line, 'R8', `data-x-component="${value}" shadows a Canon component - use data-component="${value}"`]);
        } else {
          usedExtensions.set(value, file);
        }
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

  return { violations, checked, opaque, appRules: 0, overrides: 0 };
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
let overrides = 0;
for (const file of files) {
  const result = lintFile(file);
  checked += result.checked;
  opaque += result.opaque;
  appRules += result.appRules ?? 0;
  overrides += result.overrides ?? 0;
  for (const [line, rule, msg] of result.violations) {
    console.log(`${file}:${line}  ${rule}  ${msg}`);
    total++;
  }
}

// Always print coverage, not just on success: a run that found 2 violations
// while unable to read a third of the values has not found all of them.
// Cross-file check, so it runs after every file is read. An extension used in
// markup with no rule anywhere renders bare, which is the failure this whole
// namespace exists to make visible. Only checked when at least one app layer
// was actually seen: linting markup alone cannot know what the CSS defines.
function extensionReport() {
  if (usedExtensions.size === 0 && declaredExtensions.size === 0) return '';
  const lines = [];
  if (appRules > 0) {
    for (const [name, file] of usedExtensions) {
      if (!declaredExtensions.has(name)) {
        console.log(`${file}  R8  data-x-component="${name}" has no rule in any @layer canon.app - it will render bare`);
        total++;
      }
    }
    const unused = [...declaredExtensions].filter((n) => !usedExtensions.has(n));
    if (unused.length) lines.push(`  declared but unused: ${unused.join(', ')}`);
  }
  const names = [...usedExtensions.keys()].sort();
  if (names.length) lines.push(`  ${names.length} extension component${names.length === 1 ? '' : 's'}: ${names.join(', ')}`);
  return lines.length ? '\n' + lines.join('\n') : '';
}

function themeReport() {
  if (overrides === 0) return '';
  return `
  ${overrides} token override${overrides === 1 ? '' : 's'}. That is the brand surface.`;
}

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

const extensions = extensionReport();

if (total > 0) {
  console.error(`\n✗ ${total} violation${total === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}${coverage()}${escapeHatch()}${themeReport()}${extensions}`);
  process.exit(1);
}
console.log(`✓ ${files.length} file${files.length === 1 ? '' : 's'} clean${coverage()}${escapeHatch()}${themeReport()}${extensions}`);
