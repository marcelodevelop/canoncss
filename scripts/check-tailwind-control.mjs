#!/usr/bin/env node
// Compliance checker for the Tailwind control condition.
//
// The control prompt declares a closed set of utilities, exactly as Canon's
// does. The difference is that Canon's set is enforced by canon-lint and the
// Tailwind one is enforced by nothing, because Tailwind has no idea what your
// house style is. This script is the enforcement Tailwind does not ship, built
// so the comparison is about the same thing on both sides.
//
// Usage: node scripts/check-tailwind-control.mjs <files...>

import { readFileSync } from 'node:fs';

const ALLOWED = new Set([
  ...['1', '2', '3', '4', '6', '8', '12', '16', '24'].flatMap((n) =>
    ['p', 'px', 'py', 'pt', 'pb', 'm', 'mt', 'mb', 'gap', 'space-y'].map((p) => `${p}-${n}`),
  ),
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
  'font-normal', 'font-medium', 'font-bold',
  'bg-white', 'bg-zinc-50', 'bg-zinc-100', 'dark:bg-zinc-900',
  'text-zinc-900', 'text-zinc-600', 'text-zinc-400', 'text-white',
  'bg-teal-700', 'text-teal-700', 'hover:bg-teal-800',
  'text-emerald-600', 'text-amber-600', 'text-red-600', 'text-blue-600',
  'border-zinc-200', 'border-zinc-300',
  'rounded', 'rounded-md', 'rounded-lg', 'rounded-full',
  'shadow-sm', 'shadow', 'shadow-lg',
  'max-w-prose', 'max-w-4xl', 'max-w-6xl', 'mx-auto',
  'flex', 'flex-col', 'items-center', 'justify-between', 'justify-center',
  'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
  'grid-cols-[16rem_1fr]', 'min-h-screen',
  'border', 'border-b', 'border-t', 'border-2', 'border-teal-700',
  'inline-flex', 'w-full', 'block', 'text-left', 'cursor-pointer',
  'hover:bg-zinc-50', 'hover:bg-zinc-100', 'bg-teal-50',
]);

let total = 0;
let offenders = 0;
const seen = new Map();

for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf-8');
  const bad = new Set();
  for (const m of src.matchAll(/\bclass="([^"]*)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (!cls) continue;
      total++;
      if (!ALLOWED.has(cls)) {
        bad.add(cls);
        seen.set(cls, (seen.get(cls) ?? 0) + 1);
      }
    }
  }
  if (bad.size > 0) {
    offenders++;
    console.log(`${file}  ${bad.size} class${bad.size === 1 ? '' : 'es'} outside the declared set`);
    console.log(`  ${[...bad].sort().join(' ')}`);
  } else {
    console.log(`${file}  clean`);
  }
}

const uses = [...seen.values()].reduce((a, b) => a + b, 0);
console.log(`\n${offenders} of ${process.argv.length - 2} files drifted outside the house style.`);
console.log(`${uses} of ${total} class uses (${Math.round((uses / total) * 100)}%) are not in the declared set.`);
