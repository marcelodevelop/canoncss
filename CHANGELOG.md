# Changelog

All notable changes to Canon CSS are documented here.
Format: [Keep a Changelog](https://keepachangelog.com). Versioning: [SemVer](https://semver.org).

## [Unreleased]

### Added
- **`data-component="stepper"`**: an `<ol>` of checkout or onboarding steps.
  Current step is `aria-current="step"`, the same standard-attribute pattern
  `nav` uses; completed steps are `data-state="complete"`; upcoming is neither,
  because a default should not need a name. Numbers and rails are generated, so
  the markup carries no index to fall out of order. On a narrow screen only the
  current label survives, which is what makes every hand-built version of this
  overflow.
- **`npm run repro -- --churn <base> <edited...>`**: measures how much of a page
  an edit rewrites, in styling decisions and in lines, each normalised by the
  base file. Reproduction measures writing a page twice; this measures the other
  half of the work.
- **`scripts/check-tailwind-patterns.mjs`**: enforces rule 3 of the Tailwind
  control, the verbatim component patterns, which `check-tailwind-control.mjs`
  never covered. Written to refute a finding of this project's own, and it did.

### Measured
- The stepper **did not do what was predicted**. All five generations adopted
  it and stopped writing their own extension, which removes an app layer from
  every checkout page. But structure stayed flat at 81% and only modifiers
  moved, 67% to 72%. The double-digit structural gain `disclosure` produced did
  not repeat.
- That refines the admission test. The divergence measured was in **what an
  extension was called**, three names for one thing. Naming divergence is
  cosmetic; only structural divergence costs points.
- A convention written to settle the real divergence, whether a price is a
  `stat` and whether a form section is a `card`, **made it worse**: 78%
  structure and 65% modifiers. `card` usage went from 1-4 across generations to
  0-3, more polarised rather than less, because "a thing in a set" is a
  judgement call. Reverted. A canonical default that requires judgement is
  worse than no default.
- `data-cols` capping at 4 turned out not to be a gap. Across 108 real uses in
  the corpus nobody ever wanted 5 or 6. The only case above 4 is a 7-column
  calendar, ten times, always inside an app layer that a calendar needs anyway.
- **Finding 6, and it is the first answer to Finding 2.** Same base page, same
  change request, three clean-context agents per styling system, four requests
  across two specs. Tightening the vertical rhythm changed **5-6 of Canon's
  styling decisions against 21-29 of strict Tailwind's** on pricing, and **3-4
  against 8** on the dashboard.
- **Two of the four requests are controls and both came out level.** Adding a
  section and removing a plan are the same work either way. On the removal all
  six runs produced byte-identical decisions and every one touched exactly one
  thing outside the deleted block. There is no general editing advantage, only a
  cross-cutting one.
- **The first version of this reported a percentage, and the second spec
  killed it.** 8% against 16% inverts to 6% against 4% on the dashboard, because
  dividing by each file's own token count divides by a base that differs
  fourfold between the systems. The count and the line figure agree on both
  specs; the percentage does not. `--churn` now prints the count first and says
  so in its own output. Second time in this corpus that a second spec has caught
  a conclusion drawn from one.
- **The mechanism is that a strict prompt cannot survive its own edits, and it
  replicated.** Six runs of six across both specs: `py-12` went to zero uses and
  `p-6` from six or seven down to one, so a routine density request deleted the
  house style's verbatim patterns from the page. `check-tailwind-control.mjs`,
  which found zero violations at generation time, reports 0 of 2058 class uses
  outside the declared set on the edited files: the edit stayed inside the
  allowed utilities while dismantling the patterns built from them.
- **We then concluded that rule 3 was not mechanically enforceable, and that was
  wrong.** `check-tailwind-patterns.mjs` was written to refute it and does: about
  a hundred lines, **1 flag in 272 identified patterns** on unedited control
  files and **39** on the edited ones, naming every `Card` that lost its `p-6`.
  The structural argument failed because the density edit changed only spacing
  classes and left the identifying ones intact, so the card was still
  recognisable afterwards. Rule 3 is enforceable; it had just not been enforced.
- **What survives is one sentence wide.** Rebrand the same page, `bg-teal-700` to
  `bg-indigo-700`, which identifies the Button primary pattern rather than spaces
  it. The three buttons are still in the file, the checker's identified count
  drops 18 to 15, and it reports clean: a button it cannot recognise is
  indistinguishable from a button that is not there. An enforcement built on
  class strings goes blind exactly where an edit changes what identifies a
  component. Naming the component apart from styling it is what closes that hole,
  and it is the only part of this finding that is structural rather than a matter
  of who wrote which script.
- **Canon has a floor too, and the dashboard found it.** Eight of that page's
  fifteen gaps were already at `xs` and the base carried no `data-padding`, so
  two of three runs reported that card interiors could not be tightened without
  leaving the vocabulary. Part of the low edit count is a request declined. The
  difference is not that Canon can and Tailwind cannot; it is that Canon's runs
  stopped and said so and stayed lint-clean, and nothing registered when the
  Tailwind runs went through the floor instead.

## [0.2.1] - 2026-08-04

Fixes a contradiction shipped in 0.2.0.

### Fixed
- **The extension rule contradicted the linter.** 0.2.0 told you to reuse
  Canon's modifiers on an extension, then failed you for writing
  `data-variant="unavailable"`, because `data-variant` holds Canon's closed
  value set. Measured on four clean-context generations of a page needing a
  calendar: 24 violations, 22 of them that one mistake. Extensions now have
  `data-x-variant` and `data-x-state`, which take any kebab-case value.
- **`data-x-slot` was missing from the prompt.** 0.2.0 described the namespace
  without it, so generations shattered one calendar into `calendar`,
  `calendar-grid`, `calendar-day` and `calendar-weekday` as siblings purely to
  have somewhere to hang the names. With slots in the prompt the same spec
  produced zero violations and the names converged to `calendar` and `dropzone`
  in every generation.

### Added
- **`date-field`**, the first reference extension, and `canon-init --extension`.
  A compact date picker as a zero-JS `<details>` popover. Canon has no
  datepicker and by the admission test should not have one, since generations
  converge on the shape without it. What they do not converge on is the look:
  all four produced a month-sized block sitting inline in the page, which
  reflows the form every time it opens.
- The editor autocomplete knows the `data-x-*` namespace, so an extension
  attribute is not flagged as unknown.
- `EXTENDING.md` now ships in the package. It was written for consumers and
  they could not read it.

## [0.2.0] - 2026-08-04

Two new components, four new lint rules, a second binary, the first themes
and a supported way to build what Canon does not have. The larger change is that Canon's claims are now measured rather than
argued, including the one it loses.

### Added
- **An extension namespace.** A component Canon does not have takes
  `data-x-component` and `data-x-slot`, so the closed vocabulary stays closed
  and the page is still written in one grammar instead of falling back to
  classes. R8 checks kebab-case, refuses names that shadow a real component,
  and fails an extension that nothing styles in any `@layer canon.app`, which
  would otherwise render bare with no warning. `EXTENDING.md` is the written
  guidance, including the rule no linter can check: reuse Canon's modifiers
  rather than inventing parallel ones.
- **Two starter themes**, `institutional` and `soft`, and `canon-init --theme`.
  Deliberately as far apart as two brands get, so the pair shows the range
  rather than two tastes of the same thing.
- **R7**: a theme token that overrides nothing is an error. A misspelled custom
  property is valid CSS that does nothing, so the page comes out almost right
  with no visible cause. Suggests the token you meant, by edit distance, and
  says nothing when the guess would be a bad one. `bin/tokens.mjs` generates
  from `src/tokens.css`, so a new token needs no other file.
- `canon-lint` reports the number of real token overrides it found. That figure
  is the size of the brand surface.
- **`data-component="nav"`**: a list of navigation links. The current item is
  `aria-current="page"`, not a `data-*` state, so marking it correctly also
  makes the page accessible.
- **An admission test in CONTRIBUTING.** A gap qualifies when generations
  diverge, not when they complain. It has already rejected two of four
  candidates.
- **`canon-init`**: copies `canon.css`, a `theme.css` and `AGENTS.md` into a
  project, then says the package is no longer required. Vendoring a single
  build-step-free file costs nothing, and a closed vocabulary should not also
  be a lock-in.
- **`@layer canon.app`**: the supported escape hatch for patterns the
  vocabulary does not cover. Declared and left empty. `canon-lint` reads `.css`
  now, fails on a hardcoded colour or spacing inside that layer, and counts the
  rules it finds. The count never fails a build: it measures what Canon is
  missing for that codebase.
- **`data-component="disclosure"`** on `<details>`: zero-JS expand and collapse,
  the mechanism the topbar burger already used, generalised. The caret is
  generated so the markup carries no icon to get wrong.
- Checkbox and radio inputs render correctly bare, along with a `<label>` that
  wraps its own control. Deliberately no `data-component`: `type="checkbox"`
  already declares the role.
- `canon-lint` reports its own coverage, so a clean run on a codebase full of
  JSX expression values states how much it could actually read.
- **`npm run repro`**: measures how much two or more generations of one spec
  share, reporting structure and modifiers separately, plus a
  framework-neutral `--neutral` mode for comparing against other systems.
- **Canonical defaults** in both prompts: which gap to reach for at each level,
  how to write a number with a unit, how to highlight one card, and that a
  control and its label are a stack.
- A list inside `<nav>` no longer gets bullets.
- `canon.theme` is now declared in the layer order. It worked before only
  because an undeclared layer sorts last.
- `scripts/check-docs.mjs` fails the build when the README counts or the prompt
  fall out of sync with `bin/vocab.mjs`.

### Measured
Three conditions, two specs, forty generations. Full tables in
[`test-llm/README.md`](test-llm/README.md).

- Canon reproduces **91% of its structure** across generations of one spec, on
  both a pricing page and an admin dashboard.
- Against Tailwind under an equally strict house-style prompt, Canon does
  **not** win: 88/92 against 90/90 on pricing, 93/94 against 90/91 on the
  dashboard. Strictness of the specification is what does the work.
- Against Tailwind as teams actually brief it, the gap is large: **58% to 67%**
  styling agreement against Canon's 90%, in **90 to 159 styling decisions per
  page against 41 to 43**.
- **The brand does not leak into the markup.** Two opposite brands, each with
  its own theme overriding 49 tokens of which only two matched, produced markup
  that was **96% structurally identical**. That is the one result a utility
  framework cannot reproduce.

### Fixed
- The documented lint command. `npx canon-lint` resolves by package name and
  404s; the package is `canoncss`.

## [0.1.0] - 2026-08-02

Initial release.

### The framework
- Closed-vocabulary CSS framework driven by `data-*` attributes - no classes,
  no build step, zero JavaScript. ~21kb raw / ~4.2kb gzipped.
- 5 cascade layers: `canon.reset → tokens → layouts → components → utilities`.
- **Tokens**: 6 spacing steps, 7 type sizes, semantic color roles (ink & rubric
  palette - warm paper, ink primary, vermilion accent), 4 radii, 3 shadows,
  3 font stacks (sans / display serif / mono), motion tokens.
- **7 layouts**: `stack`, `row`, `grid`, `sidebar`, `centered`, `hero`, `split`
  with shared `data-gap` / `data-align` / `data-justify` modifiers and
  automatic responsive collapse.
- **12 components**: `button`, `card` (with `media|header|body|footer` slots
  and a `featured` variant), `badge`, `input`, `textarea`, `select`, `topbar`,
  `modal`, `avatar`, `stat`, `table`, `divider`.
- Prose primitives styled bare: lists, blockquote (rubric border), pre/code.
- Components are LLM-proof: card/modal headers normalize any heading tag;
  badges never stretch; nested brand anchors inherit.
- Dark mode is explicit only: `data-theme="dark"` on `<html>`. Light is the
  default; there is no automatic `prefers-color-scheme` switching.

### The LLM layer
- `prompts/system-prompt.txt` (~750 tokens) and `system-prompt-full.txt`
  (with canonical patterns + anti-patterns).
- `prompts/AGENTS.md` - drop-in for Cursor/Copilot/Codex, auto-generated from
  the system prompt by the build.
- Claude Code plugin: `/plugin marketplace add marcelodevelop/canoncss`.
- `canon-lint` - zero-dependency validator for the four rules (closed
  vocabulary, no inline styles, no style blocks, layout XOR component).

### Validation
- 3 training iterations against clean-context LLMs (structural gaps found:
  5 → 2 cosmetic → 0).
- Regression corpus: 20 LLM-generated pages including a complete 7-page
  product (marketing + auth + dark-mode app) generated by 7 blind agents -
  every page lint-clean, one coherent visual identity.

### Site
- Next.js docs site in `site/` (Vercel root directory: `site`): docs,
  live playground, and an honest Tailwind/vanilla/Canon comparison.
