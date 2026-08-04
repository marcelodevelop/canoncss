# Changelog

All notable changes to Canon CSS are documented here.
Format: [Keep a Changelog](https://keepachangelog.com). Versioning: [SemVer](https://semver.org).

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
