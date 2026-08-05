# Canon CSS

[![npm](https://img.shields.io/npm/v/canoncss)](https://www.npmjs.com/package/canoncss)
[![CI](https://github.com/marcelodevelop/canoncss/actions/workflows/ci.yml/badge.svg)](https://github.com/marcelodevelop/canoncss/actions)

**[canoncss.com](https://www.canoncss.com)** - docs, live playground, comparison.

**A CSS framework designed for LLMs. One right way to do each thing.**

Canon's hypothesis: the problem with current frameworks isn't technical, it's
epistemological - they have too many degrees of freedom. Tailwind has hundreds
of valid ways to center a div; an LLM picks between them by statistical
distribution, not reasoning, and the output is inconsistent. Canon's answer is
**semantic restriction**:

- **Closed vocabulary** - exactly N options per dimension, never more
- **Intent over implementation** - declare what something *is*, not how it looks
- **One canonical form per pattern** - the framework offers no alternatives
- **Docs as a technical artifact** - `/prompts` is a first-class citizen you
  inject into any model

Pure CSS. Zero JavaScript. Zero build step. One file.

## Install

```bash
npm install canoncss
```

or zero-install via CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/marcelodevelop/canoncss@main/dist/canon.css">
```

Grab [`dist/canon.css`](dist/canon.css) - **~29kb raw, ~5.5kb gzipped**, smaller
than a single webfont. There is deliberately no modular install: at this size a
pick-what-you-need build step would cost more in tooling than it saves in bytes.
(If you insist, `src/` is modular - concatenate only the files you use.)

Or build it yourself:

```bash
npm run build
```

## Or take the code and keep it

```bash
npx -p canoncss canon-init --theme institutional
```

Copies `canon.css`, a `theme.css` and `AGENTS.md` into your project and tells
you what to do next. It never overwrites a file that already exists.

Two starter themes ship with the package, `institutional` and `soft`, and they
are as far apart as two brands get: navy and square against coral and round.
Omit `--theme` for a blank one to fill in yourself. Whichever you pick, the
file lands in your repo as ordinary CSS and nothing reads it back.

After that **you can uninstall canoncss and nothing breaks.** It is one plain
CSS file with no build step, so vendoring it costs nothing and takes the
framework out of your dependency graph entirely. Keep the package installed
only if you want `canon-lint` and the editor autocomplete.

A closed vocabulary should not also be a lock-in. The author's own portfolio
runs this way: a committed `canon.css` next to a 60-line `theme.css`, no
install.

## Use

```html
<div data-layout="grid" data-cols="3" data-gap="lg">
  <article data-component="card">
    <div data-slot="header">Title</div>
    <div data-slot="body">Content</div>
    <div data-slot="footer">
      <button data-component="button" data-variant="primary">Action</button>
    </div>
  </article>
</div>
```

The API is `data-*` attributes, not classes:

| Attribute | Purpose |
|-----------|---------|
| `data-layout` | 7 layout patterns: `stack` `row` `grid` `sidebar` `centered` `hero` `split` |
| `data-component` | 15 components: `button` `card` `badge` `input` `textarea` `select` `topbar` `modal` `avatar` `stat` `table` `divider` `disclosure` `nav` `stepper` |
| `data-slot` | Named children (`header`, `body`, `footer`, `sidebar`, `main`, …) |
| `data-gap` / `data-align` / `data-justify` | Layout modifiers |
| `data-variant` / `data-size` / `data-state` | Component modifiers |

Dark mode is one attribute: `<html data-theme="dark">`.

## For LLMs

Three ways, pick one:

- **Claude Code plugin** - `/plugin marketplace add marcelodevelop/canoncss`,
  then `/plugin install canon-css@canon`. Claude speaks Canon in every project
  automatically.
- **Any coding agent** - copy [`prompts/AGENTS.md`](prompts/AGENTS.md) into your
  repo root (works with Cursor, Copilot, Codex, Claude Code).
- **Raw prompt** - inject [`prompts/system-prompt.txt`](prompts/system-prompt.txt)
  (6kb, roughly 1.5k tokens) as a system message. If output drifts, use
  [`prompts/system-prompt-full.txt`](prompts/system-prompt-full.txt), which adds
  canonical patterns and anti-patterns. See [`prompts/README.md`](prompts/README.md).

## Validate

LLM generated the markup? Verify it mechanically:

```bash
npx -p canoncss canon-lint src/
```

(`npx canon-lint` alone fails: npx resolves by package name, and the package is
`canoncss`. Once it is a dependency, plain `npx canon-lint src/` works.)

Zero-dependency linter that enforces the rules: closed-vocabulary values (R1),
no inline styles (R2), no `<style>` blocks (R3), never `data-layout` +
`data-component` on one element (R4), and every component role on its canonical
element (R5, so `<div data-component="button">` fails). Exit 1 on violations -
CI-ready. This closes the loop: *the LLM generates, Canon validates.*

It also reports its own coverage. A value written as a JSX expression
(`data-variant={x}`) cannot be read, so a clean result on a React codebase
states how much of the markup it actually checked rather than implying all of
it.

Point it at a theme file and it checks that too. A misspelled custom property
is valid CSS that overrides nothing, so `--color-brnd` produces a page that
looks almost right with no visible cause. R7 catches it and suggests the token
you meant. Your own variables are left alone.

R9 is the same failure one level up. A rule in an escape-hatch layer that
restates a value the component already has is valid CSS that changes no pixel,
and in review it reads as the change having been made. This was measured: six of
six clean-context agents asked to give cards rounder corners wrote
`border-radius: var(--radius-lg)`, which is what a card already had, and every
one reported the job done. Only provably inert declarations are flagged, so a
property the component's own variants disagree about is never judged.

R11 is the quietest one in the family. `@layer canon.apps { … }` is valid CSS
that still renders, because a layer nothing declared sorts after every layer
that was, so the page looks right. What stops is the checking: R6 no longer
reads that block for hardcoded colours, R9 no longer reads it for inert rules,
R8 no longer sees the extensions defined in it, and the app-layer count that is
supposed to measure what Canon is missing reads zero. A typo opts the file out
of the whole tool and the tool used to call it clean. Only the `canon.*`
namespace is judged, so your own `@layer components` is left alone.

## When Canon does not have it

The vocabulary is closed, not a cage. Design will ask for a datepicker, a
kanban board, a file uploader with drag and drop. None of those are in Canon
and some never will be.

Your component takes `data-x-component`, not `data-component`. The vocabulary
stays closed and yours stays visibly yours, in the same grammar:

```html
<div data-x-component="datepicker" data-padding="md" data-gap="sm">
  <div data-x-slot="grid">…</div>
</div>
```

Its CSS goes in `@layer canon.app`, a layer Canon declares and leaves empty for
you:

```css
@layer canon.app {
  [data-x-component='datepicker'] {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--space-xs);              /* tokens, not values */
    background: var(--color-surface-raised);
    border-radius: var(--radius-md);
  }
}
```

Build it from tokens: `canon-lint` fails on a hardcoded colour or spacing
inside that layer, because those are what the theme system controls.

**Reuse Canon's modifiers where Canon has the value you need.** `data-gap`,
`data-padding` and `data-size` already work on your element because they are
token-driven, and that is what decides whether your component reads like Canon
or like a guest. When Canon does not have the value, because a calendar day is
`unavailable` and no closed set was going to predict that, use `data-x-variant`
and `data-x-state`, which take anything kebab-case. Regions are `data-x-slot`.

The linter also catches the three ways this goes wrong: a name that is not
kebab-case, a name that shadows a real Canon component, and an extension used in
markup that nothing styles, which would otherwise render bare with no warning.

One reference extension ships with the package:

```bash
npx -p canoncss canon-init --extension date-field
```

A compact date picker as a zero-JS `<details>` popover, because Canon has no
datepicker and the ones models write unprompted come out as a month-sized block
sitting inline in the page. It is not vocabulary, it lands in your repo, and it
is yours to change.

The full guide is [EXTENDING.md](EXTENDING.md).

It also **counts** the rules and lists your extensions on every run. That is the
point: the size of your app layer measures what Canon is missing for your
product. It is meant to be looked at, not hidden. A big one is a bug report, and
the vocabulary is supposed to grow toward it on the evidence rule in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Editor autocomplete

Canon ships a VS Code [custom data](https://code.visualstudio.com/api/extension-guides/custom-data-extension)
file, generated from the same vocabulary the linter enforces. Point your
workspace settings at it and every `data-*` attribute and value autocompletes,
no extension required:

```json
{
  "html.customData": ["./node_modules/canoncss/vscode/canon.html-data.json"]
}
```

## Proof

Canon ran a measurement study on itself and published the result, including the
condition it loses. **[RESEARCH.md](RESEARCH.md)** is the write-up: three
styling conditions, three page specs, 74 generations, and five findings, one of
which says a strict prompt over Tailwind reproduces as well as a closed
vocabulary does.

It is worth reading even if you have no interest in adopting a CSS framework.
The metric is framework-neutral and it was built to measure Tailwind as much as
this.


The claim is testable, so we test it. [`test-llm/`](test-llm/) holds a
**20-page regression corpus generated by clean-context LLMs** given only the
system prompt - dashboards, landings, blogs, e-commerce, and a complete
7-page product (marketing + auth + dark-mode app) written by 7 agents that
never saw each other's output. Every page: zero rule violations, one coherent
visual identity. `npm test` re-validates the whole corpus on every change.

Zero violations only proves the model followed the rules. The thesis is that it
produces the *same thing*, which needs a different measurement: generate one
spec five times and compare the outputs to each other. Canon scores **91%
structural reproduction** on two unrelated specs, a pricing page and an admin
dashboard, measured with `npm run repro`.

**And a control group says that is not unique to Canon.** Both specs were
rebuilt with Tailwind under an equally strict house-style prompt. It matched
Canon on the pricing page (88% element sequence to Canon's 90%, 92% styling
agreement to Canon's 90%) and beat it on the dashboard (93% and 94% against
Canon's 90% and 91%). Both scored zero violations of their own rules, across
3811 class uses.

**Against Tailwind as teams actually brief it, the gap is large.** A third
condition used a competent prompt with no closed vocabulary: consistent
spacing, one palette, a type scale, accessible semantics. It agreed on only
**58% to 67%** of its styling vocabulary against Canon's 90%, and needed **90
to 159 styling decisions per page against Canon's 41 to 43**.

So the diagnosis is demonstrated, not just asserted: too many degrees of
freedom does produce inconsistency, and the effect is large. The honest limit
is on the remedy. A closed vocabulary is not the only fix, because writing the
vocabulary down works too. Canon's case is that it **is** that written
vocabulary, already done, mechanically checked, and a third the size. The full
comparison, including where each control was unfair, is in
[`test-llm/README.md`](test-llm/README.md).

## The aesthetic moves, the skeleton does not

Canon's structure is closed. Its look is retargeted through a theme file of
token overrides. That is the founding claim, and it is now measured rather than
asserted.

Two brands built as far apart as possible, three generations each, same spec,
each agent writing its own theme: **Vault**, a compliance platform for banks,
institutional and dense, navy with sharp corners. **Bloom**, a plant care app,
warm and airy, coral with fully rounded everything.

Each theme overrode 49 tokens and **only two landed on the same value**. The
pages look like different companies. Their markup is **96% structurally
identical**, which is the same figure as two generations of the *same* brand,
and higher than the unbranded baseline.

That is the result a utility framework cannot reproduce, because there the
brand and the markup are one artefact. Change the look and you have rewritten
every element.

## Explore

- [Docs](https://www.canoncss.com) - tokens, layouts, components, live playground
- [Examples](examples/) - [landing](examples/landing/), [dashboard](examples/dashboard/),
  [app-shell](examples/app-shell/) (dark mode), [blog](examples/blog/),
  [settings](examples/settings/) (nav, disclosure, checkboxes, tables)

## Live in production

[marceloacevedo.com](https://marceloacevedo.com) - the author's entire
trilingual portfolio was refactored from Tailwind to Canon **by LLM agents**,
keeping its exact brand (fonts, colors, pill buttons, oversized type) via a
~60-line theme file of token overrides. Net result: -770 lines, zero Tailwind,
same look.

## Repo layout

```
src/        Modular source (reset, tokens, layouts, components, utilities)
dist/       canon.css - single-file build
prompts/    System prompts for LLMs
bin/        canon-lint + the vocabulary tables it validates against
examples/   Five pages built with zero extra CSS
test-llm/   LLM regression corpus
scripts/    build.sh (cat + comment-strip)
vscode/     generated html.customData for editor autocomplete
```

Cascade order: `canon.reset → canon.tokens → canon.layouts → canon.components → canon.utilities`.

## Rules

1. Only defined tokens. If a value has no token, it does not exist.
2. No inline styles, no extra CSS.
3. An element gets `data-layout` **or** `data-component`, never both.
4. `data-slot` only as a direct child of its parent layout/component.
5. If a pattern has no vocabulary, it goes in `@layer canon.app`, built only
   from tokens. The layer is counted, not hidden.
6. A theme overrides real tokens. A name that overrides nothing is an error,
   not a no-op.
7. Every component role sits on its canonical element. A role is a promise
   about behaviour, not just looks.
8. Theming: adapt Canon to the brand, never bend the markup. A theme file
   overrides any token on `:root` (colors, fonts, type scale, radii, shadows)
   plus a small `@layer canon.theme` block for details tokens cannot express.
   This is how an LLM ports an existing site to Canon while keeping its exact
   look - see the live example below.

## License

MIT
