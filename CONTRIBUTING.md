# Contributing to Canon

## Setup

No dependencies for the framework itself. You need bash and Node 18+.

```bash
npm run build   # concatenates src/ into dist/canon.css + regenerates prompts/AGENTS.md
npm test        # lints the 20-page LLM regression corpus + the violations fixture
```

The docs site is a separate repo,
[canonframework-landing](https://github.com/marcelodevelop/canonframework-landing),
deployed at [canoncss.com](https://www.canoncss.com). It vendors a snapshot of
`dist/canon.css` and `prompts/`, so propagate framework changes there by hand.

## The golden rule

**A vocabulary change is not one change - it is five.** Any new component,
layout, token, modifier or slot must land in the same PR across:

1. `src/*.css` - the implementation
2. `prompts/system-prompt.txt` - the short prompt (see the budget note below)
3. `prompts/system-prompt-full.txt` - patterns/anti-patterns if relevant
4. `plugins/canon-css/skills/canon-css/SKILL.md` - the Claude Code skill
5. `bin/vocab.mjs` - the `VOCAB` and `ELEMENTS` tables

`npm test` fails if the README counts or the prompt fall out of sync with
`bin/vocab.mjs`, so step 5 cannot silently be the only one done.

`prompts/AGENTS.md`, `vscode/canon.html-data.json`, `types/canon.d.ts` and
`bin/tokens.mjs` regenerate at build time (from the short prompt, from
`bin/vocab.mjs` and from `src/tokens.css`) - never edit them by hand. CI fails
if any of them drifted from what the build produces.

The type declarations mean a vocabulary change is checked twice. `npm test`
stays dependency-free; `npm run test:types` installs TypeScript with
`--no-save` and asserts both halves: the vocabulary compiles, and everything
outside it does not.

A new token therefore needs nothing beyond `src/tokens.css`: the linter picks
it up on the next build.

## The prompt budget

The short prompt used to carry a "keep it under ~800 tokens" rule. That number
was never measured and the file had already drifted past it. It is now about
1.25k tokens, and the growth is justified by measurement rather than allowed by
neglect.

Adding ~250 tokens of canonical defaults moved structural reproduction from 92%
to 95% and modifier reproduction from 79% to 84%. Length is not the thing to
optimise: reproduction is. Grow the prompt when `npm run repro` says the
addition paid for itself, and cut anything that cannot show the same.

## Measuring a prompt change

Prompt edits are the highest-leverage and least verifiable change in this repo.
`npm run repro` gives them a number:

```bash
npm run repro -- gen-a.html gen-b.html gen-c.html
```

Generate the same spec two or more times, then compare. It reports two figures,
deliberately not blended:

- **structure** (`data-layout`, `data-component`, `data-slot`) is the skeleton,
  and it is what the closed-vocabulary claim is actually about.
- **modifiers** (`data-gap`, `data-align`, `data-variant`, ...) are cosmetics.
  Movement here changes how a page looks, not what it is.

A prompt change that raises structure is a win. One that only moves modifiers is
noise. Values written as JSX expressions cannot be compared, so the tool reports
what share of the markup its score actually covers.

Do not compare generations made with different prompt versions and call the
result drift: it conflates the prompt change with generation variance.

## The escape hatch

A closed vocabulary needs a supported door, or people cut their own. Canon
declares `@layer canon.app` and leaves it empty. Anything the vocabulary does
not cover goes there, built only from tokens.

`canon-lint` reads `.css` files now. Inside that layer it fails on a hardcoded
colour or spacing value, and it counts the rules it finds and prints the total.
The count never fails a build on its own: it is a measurement, and the thing it
measures is what Canon is missing for that codebase.

That number is the input to the admission test above. A pattern showing up in
several independent app layers is a candidate. One appearing once is somebody's
edge case.

## When a component earns its place

Every opinionated framework drifts. Users bring edge cases, each one sounds
reasonable, and after fifty of them you have utility classes again with worse
syntax. The defence is not taste, it is a test that can say no.

**A gap qualifies when generations diverge, not when they complain.**

Requests are cheap. Divergence is evidence. Run the same spec through several
clean-context agents, then check both things:

1. Did they ask for it?
2. Did they build it differently from each other?

Only the second answer decides. If they all reached the same construction
without the component, the vocabulary already covers it and the request is for
a name, not a capability.

Two worked examples from August 2026, both from the same five generations:

| Candidate | Asked for it | Built it differently | Verdict |
|---|---|---|---|
| Collapsible FAQ | 5 of 5 | Yes: split into two incompatible families, cards against bare prose stacks | **Added** as `disclosure` |
| Footer construct | 3 of 5 | No: 4 of 5 wrote `<footer data-layout="grid" data-cols="3" data-gap="xl" data-padding="xl">` with three stacks inside | **Rejected** |

The FAQ gap cost 11 points of structural reproduction. The footer costs
nothing, because the vocabulary already produces one answer. Adding a `footer`
component would have bought a nicer-sounding attribute and one more thing to
maintain.

When the answer is no, the request is often still real. It usually means the
prompt should state the canonical construction, which is free, rather than the
CSS growing a component, which is not.

### The one time this rule was suspended, and why

August 2026. `alert`, `breadcrumb` and `pagination` were added on **framework
parity, not on measured divergence**. No generation experiment was run for
them. That is the admission test being set aside, and it is written down here
rather than quietly skipped, because a rule with an undocumented exception is
just a rule nobody follows.

The argument for suspending it is a real chicken and egg. The test needs
several independent agents to diverge on a spec, and the most useful divergence
comes from people building things nobody here would think to build. Canon has
one production user, so the evidence the rule wants cannot exist yet in the
volume the rule assumes. Waiting for it means shipping nothing an evaluator
recognises, and an evaluator who bounces never becomes the evidence.

The exception was kept narrow on purpose:

- All three appear in **every** major framework (Bootstrap, Bulma, Material,
  Chakra, shadcn/ui). Universal presence is weaker evidence than divergence,
  but it is not no evidence: it is the industry having converged.
- All three are zero-JS, which is non-negotiable, and that is what ruled out
  tabs, toast, dropdown and carousel however common they are.
- None of them overlaps something the vocabulary can already express. That test
  did **not** get suspended, and it is the one that rejected a `field`
  component for label-plus-control, because the prompt already states the
  canonical construction (a stack with `data-gap="xs"`).
- Two more gaps, `progress` and a switch, were closed **without** growing the
  vocabulary at all, because the element and the ARIA role already declare
  themselves. Capability rose by five and the closed vocabulary by three.

This is a debt, not a precedent. The first real external users are the evidence
these three were supposed to have, and if any of them turns out to be a name
rather than a capability, it should come back out.

### The debt was paid, and one of the three came back out

The experiment was run rather than left owed. Ten clean-context generations
across two specs, on the vocabulary **as it stood before these three existed**,
which is what makes it evidence: the models had to build the patterns out of
what was there. Both specs described the need and never named a component, so
the construction was theirs to choose. `test-llm/admission-docs/` and
`test-llm/admission-tickets/`; `node scripts/admission.mjs <dir> --spec <name>`
reproduces the analysis, which was written before the pages were read.

All ten reached for all three patterns. What they built:

| Candidate | Reached for it | Built it differently | Verdict |
|---|---|---|---|
| Block-level notice | 10 of 10 | Yes: 8 cards against 2 bare stacks, and the card family could not agree whether severity was `data-variant="featured"`, `data-tone="error"`, or the badge inside it | **Kept** as `alert` |
| Where am I | 10 of 10 | Yes: 5 built crumbs from `<a>` and 5 from `<button data-variant="link">`, a even split on two different keyboard and screen-reader contracts | **Kept** as `breadcrumb` |
| Move through pages | 10 of 10 | **No.** Three of five wrote `<nav aria-label="Pagination" data-layout="row" data-gap="sm" data-align="center" data-wrap>` almost to the character, ghost for other pages, primary plus `aria-current="page"` for the current one, secondary for prev/next. The only variation was `data-gap` sm against md | **Removed** |

The pager is the footer case again, and the rule caught it two commits after it
shipped. Ten generations converged **structurally** and varied only in
modifiers, which is the same distinction `npm run repro` draws: movement there
changes how a page looks, not what it is. So the request was for a name and not
a capability, and the fix the rule prescribes is free. The construction is now
stated in both prompts and in the skill, where it costs nothing to maintain and
cannot drift out of sync with a stylesheet.

Two things worth keeping from the run that are not verdicts:

- **Three of five docs generations reused `stepper` for "page 3 of 7"**, which
  is a component for checkout and onboarding steps being pressed into service
  as a position indicator. That is a component being misused because the gap
  beside it was unfilled, and it is the most interesting open question the run
  produced. It is not acted on here: the position indicator split three ways
  across five files, which is a small N on a sub-pattern, and the rule wants a
  spec of its own before anything is added for it.
- **All 15 lint violations in the corpus were the same one**,
  `<ul data-component="nav">` where the role belongs on the wrapper. Ordinary
  generation noise, baselined in `npm test` rather than edited away, because
  editing a corpus deletes the measurement it exists to hold.

## Design principles (non-negotiable)

- **One right way.** If a pattern can already be expressed, do not add a
  second spelling for it. Additions need evidence - ideally an LLM generation
  that reached for something that didn't exist (see `test-llm/`).
- **Intent over implementation.** Attributes say what something *is*
  (`data-layout="sidebar"`), never how it renders.
- **LLM-proof beats documented.** If a wrong-looking output is possible, fix
  the CSS so it looks right anyway (e.g. card headers normalize any heading
  tag). Prompt guidance is the fallback, not the fix.
- **Zero JavaScript, zero build, one file.** Non-negotiable.
- If a value has no token, it does not exist.

## Validating a change

1. `npm run build && npm test` - the corpus must stay clean.
2. Open `examples/*.html` in a browser - they must render perfectly with only
   `dist/canon.css`.
3. For vocabulary changes: run a clean-context LLM with only
   `prompts/system-prompt.txt` and a relevant task, save the output under
   `test-llm/`, lint it, and add it to `scripts/test.sh`. Adoption by a blind
   model is the acceptance test.

## Commit hygiene

Run a secrets scan before committing (`gitleaks protect --staged`). CI runs
build, tests and a full-history gitleaks scan on every push.
