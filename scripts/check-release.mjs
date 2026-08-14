#!/usr/bin/env node
// Asserts the repo agrees with itself about what version it is.
//
// It did not, for five releases running. Tags v0.1.1 through v0.4.0 were cut
// and published to npm, and every one of them carries a package.json saying
// 0.1.0 and a dist/canon.css whose header says "Canon CSS v0.1.0". The bump
// happened at publish time and never came back to the repo, so anyone who
// opened the stylesheet they installed was told the wrong version, and the
// CHANGELOG had no section for 0.3.0 or 0.4.0 at all.
//
// Three checks, each one a thing that was actually wrong:
//
//   the header    dist/canon.css must state the version in package.json.
//                 build.sh writes it from there, so this only fails when dist
//                 is stale, which is the case the drift check already covers
//                 from the other side.
//   the changelog package.json's version must have a `## [x.y.z]` section.
//                 This is the one that forces a bump and its notes to move
//                 together, which is what stopped happening.
//   the tags      no release tag may be ahead of package.json. This is the
//                 failure itself: a tag raced ahead five times and nothing
//                 noticed. Skipped when no tags are present, because a shallow
//                 CI checkout has none and a missing tag is not a violation.
//
// Usage: node scripts/check-release.mjs

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const failures = [];
const version = JSON.parse(readFileSync('package.json', 'utf-8')).version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  failures.push(`package.json version "${version}" is not x.y.z`);
}

// The header of the file everyone actually downloads.
const header = readFileSync('dist/canon.css', 'utf-8').split('\n')[0];
const stated = header.match(/Canon CSS v(\d+\.\d+\.\d+)/);
if (!stated) {
  failures.push('dist/canon.css no longer states a version in its first line');
} else if (stated[1] !== version) {
  failures.push(`dist/canon.css says v${stated[1]}, package.json says ${version} - run npm run build`);
}

// The prompts are the artifact users are told to copy into their own repos,
// and their header is the only marker of which vocabulary generation a stale
// copy teaches. It said v0.1 through five releases while nothing checked it.
// build.sh stamps it now, so as with dist this only fails on a skipped build.
for (const file of ['prompts/system-prompt.txt', 'prompts/system-prompt-full.txt', 'prompts/AGENTS.md']) {
  const lines = readFileSync(file, 'utf-8').split('\n');
  // AGENTS.md wraps system-prompt.txt in a fenced block, so its stamp is the
  // first line carrying one rather than line one of the file.
  const head = file.endsWith('.md') ? (lines.find((l) => l.startsWith('CANON CSS v')) ?? '') : lines[0];
  const says = head.match(/^CANON CSS v(\d+\.\d+\.\d+) /);
  if (!says) {
    failures.push(`${file} does not state a full x.y.z version in its header`);
  } else if (says[1] !== version) {
    failures.push(`${file} says v${says[1]}, package.json says ${version} - run npm run build`);
  }
}

// A version with no notes is a release nobody can read.
const changelog = readFileSync('CHANGELOG.md', 'utf-8');
if (!new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm').test(changelog)) {
  failures.push(`CHANGELOG.md has no "## [${version}]" section`);
}

// The check that would have caught the original drift.
const cmp = (a, b) => {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

let tags = [];
try {
  tags = execSync('git tag --list "v*"', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n')
    .map((t) => t.trim().replace(/^v/, ''))
    .filter((t) => /^\d+\.\d+\.\d+$/.test(t));
} catch {
  // No git, or no tags. Not a violation: see the note above.
}

if (tags.length) {
  const highest = tags.sort(cmp).at(-1);
  if (cmp(highest, version) > 0) {
    failures.push(
      `tag v${highest} is ahead of package.json ${version}. A release was cut and the bump never came back to the repo, which is exactly how the header came to lie for five versions.`
    );
  }
  // Every tag that exists is a release someone can install, so it needs notes.
  const undocumented = tags.filter(
    (t) => !new RegExp(`^## \\[${t.replace(/\./g, '\\.')}\\]`, 'm').test(changelog)
  );
  if (undocumented.length) {
    failures.push(`released but absent from CHANGELOG.md: ${undocumented.map((t) => 'v' + t).join(', ')}`);
  }
}

if (failures.length) {
  console.error('✗ the repo disagrees with itself about its version:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`✓ version ${version} is consistent across package.json, dist and the changelog`);
