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
2. `prompts/system-prompt.txt` - the short prompt (keep it under ~800 tokens)
3. `prompts/system-prompt-full.txt` - patterns/anti-patterns if relevant
4. `plugins/canon-css/skills/canon-css/SKILL.md` - the Claude Code skill
5. `bin/vocab.mjs` - the `VOCAB` and `ELEMENTS` tables

`prompts/AGENTS.md` and `vscode/canon.html-data.json` regenerate at build time
(from the short prompt and from `bin/vocab.mjs`) - never edit them by hand.

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
