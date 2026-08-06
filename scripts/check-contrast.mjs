#!/usr/bin/env node
// WCAG contrast for the pairs Canon's components actually render.
//
// The pair list below is read out of src/components.css rather than invented,
// so this measures the colours a page really puts next to each other. Themes
// are audited through the cascade a browser applies, which matters more than it
// sounds: a theme file is not in a layer, so its `:root` beats Canon's own
// layered `[data-theme="dark"]` block. A theme that redefines a token in :root
// and forgets it in its dark block silently serves the light value on a dark
// page. That is not hypothetical; it is how this script found the four broken
// badges in themes/soft.css.
//
// Usage: node scripts/check-contrast.mjs [--max N]
// Exits 1 when the number of pairs below AA exceeds N. The count is a baseline
// to hold a line against, not an endorsement: run it with no --max to see
// everything.
import { readFileSync } from 'node:fs';

const hex = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/** color-mix(in srgb, A p%, B) interpolates componentwise in sRGB. */
function resolve(value, tokens, depth = 0) {
  if (depth > 8) throw new Error('token cycle: ' + value);
  value = value.trim();
  if (value === 'black') return [0, 0, 0];
  if (value === 'white') return [255, 255, 255];
  if (value.startsWith('#')) return hex(value);

  const v = value.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/);
  if (v) {
    const next = tokens.get(v[1]);
    if (!next) throw new Error('unknown token ' + v[1]);
    return resolve(next, tokens, depth + 1);
  }

  const mix = value.match(/^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/);
  if (mix) {
    const a = resolve(mix[1], tokens, depth + 1);
    const b = resolve(mix[3], tokens, depth + 1);
    const p = Number(mix[2]) / 100;
    return a.map((c, i) => Math.round(c * p + b[i] * (1 - p)));
  }
  throw new Error('cannot resolve: ' + value);
}

const luminance = ([r, g, b]) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** Every --color-* declared in a block, last definition wins. */
function tokensFrom(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) return null;
  let i = css.indexOf('{', start) + 1;
  let depth = 1;
  const from = i;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  const body = css.slice(from, i - 1);
  const map = new Map();
  for (const m of body.matchAll(/(--color-[a-z-]+)\s*:\s*([^;]+);/g)) map.set(m[1], m[2].trim());
  return map;
}

// fg, bg, where it appears, and the threshold that applies.
// 4.5 is AA for body text; 3.0 is AA for large text and for UI component
// boundaries. Badge and button labels are small, so they get 4.5.
const PAIRS = [
  ['--color-content', '--color-surface', 'body text', 4.5],
  ['--color-content', '--color-surface-raised', 'card body', 4.5],
  ['--color-content', '--color-surface-sunken', 'sunken panel', 4.5],
  ['--color-content-subtle', '--color-surface', 'data-tone="subtle"', 4.5],
  ['--color-content-subtle', '--color-surface-raised', 'table header, badge neutral', 4.5],
  ['--color-content-inverse', '--color-brand', 'button primary', 4.5],
  ['--color-content-inverse', '--color-error', 'button danger', 4.5],
  ['--color-brand', '--color-surface', 'button link', 4.5],
  ['--color-brand', '--color-brand-subtle', 'badge brand', 4.5],
  ['--color-success', '--color-success-subtle', 'badge success', 4.5],
  ['--color-error', '--color-error-subtle', 'badge error', 4.5],
  ['--color-info', '--color-info-subtle', 'badge info', 4.5],
  ['color-mix(in srgb, var(--color-warning) 80%, black)', '--color-warning-subtle', 'badge warning', 4.5],
  // An alert holds a sentence rather than three words, so its body text is
  // --color-content and not the status colour. Four backgrounds, one text
  // colour, and all four are read at body size, so all four are 4.5.
  ['--color-content', '--color-info-subtle', 'alert info', 4.5],
  ['--color-content', '--color-success-subtle', 'alert success', 4.5],
  ['--color-content', '--color-warning-subtle', 'alert warning', 4.5],
  ['--color-content', '--color-error-subtle', 'alert error', 4.5],
  ['--color-content-inverse', '--color-brand', 'pagination current', 4.5],
  // WCAG 1.4.11 wants 3:1 for what identifies a user interface component. An
  // input, select and textarea all sit on --color-surface, the same colour as
  // the page, so the border is the only thing that says where the control is.
  // That makes it in scope.
  ['--color-border-strong', '--color-surface', 'input/select boundary', 3.0],
  // A switch says which way it is set with the thumb against the track, and
  // nothing else: no tick, no label change. That makes the pair the thing that
  // identifies the state, so 1.4.11 applies to it. The on position is the same
  // pair as button primary and already covered; this is the off position,
  // which is the tighter of the two in both shipped themes.
  ['--color-content-inverse', '--color-border-strong', 'switch off', 3.0],
  // A card is a container rather than a control, so 1.4.11 does not apply and
  // this is reported without a verdict. It is still worth seeing: a card is
  // distinguished from the page by a border and a surface one step up, and
  // neither is doing much.
  ['--color-border', '--color-surface', 'card outline (advisory)', 0],
];

function audit(label, tokens, base) {
  const merged = new Map(base ? [...base, ...tokens] : tokens);
  const rows = [];
  for (const [fg, bg, where, min] of PAIRS) {
    let r;
    try {
      r = ratio(resolve(fg.startsWith('--') ? `var(${fg})` : fg, merged), resolve(`var(${bg})`, merged));
    } catch (e) {
      rows.push({ where, r: null, min, note: e.message });
      continue;
    }
    rows.push({ where, r, min, pass: min === 0 ? null : r >= min });
  }
  const failed = rows.filter((x) => x.pass === false);
  console.log(`\n${label}`);
  for (const x of rows) {
    if (x.r === null) {
      console.log(`  ?      ${x.where.padEnd(26)} ${x.note}`);
      continue;
    }
    const verdict = x.pass === null ? '--  ' : x.pass ? 'ok  ' : 'FAIL';
    const need = x.min === 0 ? '' : `  (needs ${x.min})`;
    console.log(`  ${verdict}   ${x.where.padEnd(26)} ${x.r.toFixed(2)}:1${need}`);
  }
  return failed.length;
}

const base = readFileSync('src/tokens.css', 'utf-8');
const light = tokensFrom(base, ':root');
const dark = tokensFrom(base, '[data-theme="dark"]');

let failures = 0;
failures += audit('default theme, light', light);
failures += audit('default theme, dark', dark, light);

// The cascade a real page sees, in order: Canon's :root, then Canon's dark
// block if the page is dark, then the theme's :root, then the theme's own dark
// block. Getting this wrong is why an earlier run reported soft.css serving its
// light status colours in dark mode: the theme does not redefine them, and
// Canon's dark block does.
for (const t of ['themes/institutional.css', 'themes/soft.css']) {
  const css = readFileSync(t, 'utf-8');
  const l = tokensFrom(css, ':root');
  const d = tokensFrom(css, '[data-theme="dark"]');
  if (l) failures += audit(`${t}, light`, l, light);
  if (d) failures += audit(`${t}, dark`, d, new Map([...light, ...dark, ...(l ?? [])]));
}

const maxArg = process.argv.indexOf('--max');
const max = maxArg === -1 ? null : Number(process.argv[maxArg + 1]);

console.log(`\n${failures} pair(s) below their WCAG AA threshold.`);

if (max !== null && failures > max) {
  console.error(`✗ contrast regressed: ${failures} failing pairs, baseline is ${max}`);
  process.exit(1);
}
if (max !== null && failures < max) {
  console.error(`✗ ${failures} failing pairs, baseline says ${max}. Lower the baseline in scripts/test.sh.`);
  process.exit(1);
}
