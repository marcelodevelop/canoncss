# Long-context drift report, August 2026

Canon's existing evidence is a corpus generated in short, clean-context
sessions. The claim Canon makes is about agents building applications, and
agents work in long sessions. This report measures what happens there.

Method and limitations were fixed in advance, in
[the design spec](superpowers/specs/2026-08-03-canon-stock-drift-test-design.md).
The result is published as measured.

## What was built

[canon-stock](https://github.com/marcelodevelop/canon-stock), an offline
inventory manager for small businesses. Vite, React, TypeScript, six screens,
`localStorage` for persistence. Built in one session. `canon-lint` was run at
each step and violations were deliberately not fixed until the end, so the
curve would survive.

React was chosen over plain HTML on purpose. Plain HTML would have spread the
markup over more lines, but React exercises a blind spot plain HTML cannot
reach.

## Result 1: violations against session length

| Turn | Context | Files linted | Violations |
|---|---|---|---|
| 4 | 100-125k | 3 | 0 |
| 5 | 125-150k | 5 | 0 |
| 6 | 150-175k | 8 | 0 |

Flat at zero through 175k tokens of context. That answers the objection as
posed, and it is the least interesting number in this report.

**It covers less than it appears to.** About a third of the `data-*` values in
this application are JSX expressions, and `canon-lint` cannot read an
expression. `data-variant={m.tipo === 'entrada' ? 'success' : 'warning'}`
passes unverified. A clean lint on a React codebase is a weaker claim than a
clean lint on HTML, and the gap grows with how dynamic the markup is.

## Result 2: vocabulary escapes

Three, none of which the linter can see. These are the more informative
finding, because each one is a place the vocabulary ran out.

1. **No checkbox or radio.** Canon has `input`, `select` and `textarea`. The
   column picker in the export screen renders bare checkboxes that inherit only
   the reset, and they look unfinished beside the styled controls next to them.
   This is the clearest gap in the component set.
2. **No way to push one item to the end of a row.** `data-justify="between"`
   needs two children. With a single button, an empty `<span />` was written as
   a spacer. The vocabulary has no concept for "align this one to the far end".
3. **Unverifiable expression values.** Not a vocabulary gap but a linter gap,
   recorded here because it caps the confidence of Result 1.

## Result 3: cleanup cost

Zero. There was nothing to fix, so the planned cleanup commit is empty.

That reads as a perfect score and should not. The measurement was designed to
price drift in real work, and it returns zero partly because the instrument
cannot see the two failure modes above. The honest reading is that Canon
produced no *mechanically detectable* drift, not that it produced none.

## Result 4: repeat checkpoint

At the end of the session, the product list screen was regenerated from the
same one-paragraph requirement used at the start, without reopening the
original, and compared by longest common subsequence.

| Layer | Original | Checkpoint | Similarity |
|---|---|---|---|
| Structure (`data-layout`, `data-component`, `data-slot`) | 12 | 13 | **96%** |
| Modifiers (`data-gap`, `data-align`, `data-variant`, ...) | 11 | 10 | **76%** |

The single structural difference is one `data-layout="stack"` wrapper the
checkpoint added where the original used a fragment. Every component and layout
choice was otherwise identical. The variation is concentrated in modifiers:
`data-align="end"` became `data-align="center"`, and a gap was added.

This is the most useful result here. **Structure held and cosmetics moved.**
That is what a closed vocabulary should buy, and it is what the diff-review
argument for Canon actually rests on: a reviewer reading the diff sees the same
skeleton every time, and the parts that wobble are the parts where wobble does
not change the meaning.

## Limitations

Carried from the spec, plus one discovered during the run.

- **One session, one model, one operator.** A single sample, not a study. It
  cannot separate "Canon holds up" from "this session went well".
- **No control group.** Building the same app with Tailwind, a strict system
  prompt and a custom linter would isolate whether the closed vocabulary did
  the work or the prompt did. Not attempted.
- **The operator knew they were being measured.** Read the numbers as a floor
  on drift, not an estimate of it.
- **The repeat checkpoint was not clean-context.** The original screen was
  still in the session's context when the checkpoint was written. It was
  generated from the requirement without reopening the file, which is weaker
  than a genuine cold regeneration. The 96% figure is an upper bound.

## What changes because of this

- `canon-lint` should report how many `data-*` values it could not verify, so a
  clean result states its own coverage.
- Checkbox and radio are the first candidates for the component set, on the
  evidence of an actual build rather than a guess.
- The durable argument for Canon is Result 4, not Result 1. "LLMs are
  inconsistent" is a bet that models stay bad. "The skeleton is identical
  across regenerations, so diffs stay reviewable" holds even when they get
  good.
