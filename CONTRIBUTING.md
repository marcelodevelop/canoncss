# Contributing to Canon

## Setup

No dependencies for the framework itself. You need bash and Node 18+.

```bash
npm run build   # concatenates src/ into dist/canon.css + regenerates prompts/AGENTS.md
npm test        # lints the 20-page LLM regression corpus + the violations fixture
```

The docs site lives in `site/` (Next.js): `cd site && npm install && npm run dev`.

## The golden rule

**A vocabulary change is not one change — it is five.** Any new component,
layout, token, modifier or slot must land in the same PR across:

1. `src/*.css` — the implementation
2. `prompts/system-prompt.txt` — the short prompt (keep it under ~800 tokens)
3. `prompts/system-prompt-full.txt` — patterns/anti-patterns if relevant
4. `plugins/canon-css/skills/canon-css/SKILL.md` — the Claude Code skill
5. `bin/canon-lint.mjs` — the `VOCAB` tables

`prompts/AGENTS.md` regenerates from the short prompt at build time — never
edit it by hand.

## Design principles (non-negotiable)

- **One right way.** If a pattern can already be expressed, do not add a
  second spelling for it. Additions need evidence — ideally an LLM generation
  that reached for something that didn't exist (see `test-llm/`).
- **Intent over implementation.** Attributes say what something *is*
  (`data-layout="sidebar"`), never how it renders.
- **LLM-proof beats documented.** If a wrong-looking output is possible, fix
  the CSS so it looks right anyway (e.g. card headers normalize any heading
  tag). Prompt guidance is the fallback, not the fix.
- **Zero JavaScript, zero build, one file.** Non-negotiable.
- If a value has no token, it does not exist.

## Validating a change

1. `npm run build && npm test` — the corpus must stay clean.
2. Open `examples/*.html` in a browser — they must render perfectly with only
   `dist/canon.css`.
3. For vocabulary changes: run a clean-context LLM with only
   `prompts/system-prompt.txt` and a relevant task, save the output under
   `test-llm/`, lint it, and add it to `scripts/test.sh`. Adoption by a blind
   model is the acceptance test.

## Commit hygiene

Run a secrets scan before committing (`gitleaks protect --staged`). CI runs
build, tests and a full-history gitleaks scan on every push.
