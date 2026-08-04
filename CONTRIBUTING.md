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

`prompts/AGENTS.md` and `vscode/canon.html-data.json` regenerate at build time
(from the short prompt and from `bin/vocab.mjs`) - never edit them by hand.

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
