#!/usr/bin/env node
// canon-init - copies Canon into your project so it is yours, not a dependency.
//
// The package is one CSS file with no build step, so vendoring it costs nothing
// and removes the framework from your dependency graph entirely. After this
// runs you can delete canoncss from package.json and nothing breaks. That is
// the point: a closed vocabulary should not also be a lock-in.
//
// Usage: canon-init [target-dir] [--theme <name>] [--extension <name>]
// Exit 0 = done, 1 = nothing written, 2 = usage error.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Where a stylesheet belongs, most specific first. Falls back to cwd.
const CANDIDATES = ['src/app', 'app/styles', 'src/styles', 'app', 'src', 'styles'];

const THEME = `/* Your brand. This file is the only place Canon is allowed to vary.
   Override any token on :root and the whole framework retargets. Everything
   here is a starting point: delete what you do not need.

   Rule: token overrides only. If a brand detail cannot be expressed as a
   token, it goes in @layer canon.theme below, and anything that is not brand
   at all goes in @layer canon.app. canon-lint checks both. */

:root {
  /* Canon sets color-scheme: light here and dark on [data-theme='dark'], which
     is what paints scrollbars, native select popups and autofill. Only touch it
     if your light mode is itself dark, which is rare and deliberate. */
  /* color-scheme: dark; */

  /* --color-brand: #0f766e; */
  /* --color-accent: #ea580c; */
  /* --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif; */
  /* --font-display: "Fraunces", Georgia, serif; */
  /* --radius-md: 0.375rem; */
}

[data-theme='dark'] {
  /* --color-brand: #2dd4bf; */
}

@layer canon.theme {
  /* Brand details tokens cannot express. Keep this small. */
}
`;

function pickTarget(argv) {
  if (argv[0]) return argv[0];
  for (const dir of CANDIDATES) if (existsSync(dir)) return dir;
  return '.';
}

function copy(from, to, label) {
  if (existsSync(to)) {
    console.log(`  skipped  ${to}  (already exists)`);
    return false;
  }
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, readFileSync(from));
  console.log(`  wrote    ${to}  ${label}`);
  return true;
}

function write(to, contents, label) {
  if (existsSync(to)) {
    console.log(`  skipped  ${to}  (already exists)`);
    return false;
  }
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, contents);
  console.log(`  wrote    ${to}  ${label}`);
  return true;
}

const args = process.argv.slice(2);
const THEME_DIR = join(PKG, 'themes');
const EXT_DIR = join(PKG, 'extensions');
const listing = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => f.replace('.css', ''));
const available = () => listing(THEME_DIR);

if (args[0] === '-h' || args[0] === '--help') {
  console.log(
    `Usage: canon-init [target-dir] [--theme <name>] [--extension <name>]\n\n` +
      `Copies canon.css, a theme.css and AGENTS.md into your project.\n\n` +
      `Themes: ${available().join(', ')}, or omit for a blank one to fill in.\n` +
      `Extensions: ${listing(EXT_DIR).join(', ')}. Reference builds of things Canon\n` +
      `does not have. They land in your repo and are yours to change.`,
  );
  process.exit(0);
}

// A named theme is a starting point that lands as your theme.css, not a
// dependency. Nothing later reads it back.
const themeFlag = args.indexOf('--theme');
const themeName = themeFlag === -1 ? null : args[themeFlag + 1];
if (themeFlag !== -1) args.splice(themeFlag, themeName ? 2 : 1);
if (themeName && !available().includes(themeName)) {
  console.error(`canon-init: no theme called "${themeName}". Available: ${available().join(', ')}`);
  process.exit(2);
}

// Extensions are reference builds, not vocabulary. Same deal as a theme: the
// file lands in the repo and nothing reads it back.
const extFlag = args.indexOf('--extension');
const extName = extFlag === -1 ? null : args[extFlag + 1];
if (extFlag !== -1) args.splice(extFlag, extName ? 2 : 1);
if (extName && !listing(EXT_DIR).includes(extName)) {
  console.error(`canon-init: no extension called "${extName}". Available: ${listing(EXT_DIR).join(', ')}`);
  process.exit(2);
}

const target = pickTarget(args);
console.log(`Canon into ${resolve(target)}\n`);

let written = 0;
written += copy(join(PKG, 'dist/canon.css'), join(target, 'canon.css'), '(the framework, yours now)');
written += themeName
  ? copy(join(THEME_DIR, `${themeName}.css`), join(target, 'theme.css'), `(the ${themeName} theme, yours to edit)`)
  : write(join(target, 'theme.css'), THEME, '(your brand, start here)');
written += copy(join(PKG, 'prompts/AGENTS.md'), 'AGENTS.md', '(so coding agents speak Canon)');
if (extName) {
  written += copy(join(EXT_DIR, `${extName}.css`), join(target, `${extName}.css`), `(the ${extName} extension, yours to change)`);
}

if (written === 0) {
  console.log('\nNothing to do: every file was already there.');
  process.exit(1);
}

console.log(`
Next:
  1. Import both, in this order:  canon.css then theme.css
  2. Edit theme.css. It is the only file that should differ between brands
  3. Check it:  npx -p canoncss canon-lint <path>/theme.css
  4. Validate what your agent writes:  npx -p canoncss canon-lint src/

canoncss is no longer required at runtime. You can uninstall it and keep the
CSS: it is a plain file with no build step. Keep it installed only if you want
canon-lint and the editor autocomplete.`);
