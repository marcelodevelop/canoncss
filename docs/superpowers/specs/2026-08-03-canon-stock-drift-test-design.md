# canon-stock: a real app as a long-context drift test

Date: 2026-08-03
Status: approved, not yet implemented

## Why this exists

Three independent reviewers pushed back on Canon with the same shape of
argument, and one objection survived scrutiny: Canon's evidence measures the
easy thing. `npm test` reports zero violations across the `test-llm/` corpus,
but that corpus was generated in short, clean-context sessions. The claim Canon
actually makes is about agent-generated applications, and agents work in long
sessions.

Canon is also out of distribution. A model has seen millions of tokens of
Tailwind and shadcn during pretraining; it has seen no Canon. That means Canon
depends entirely on the in-context prompt holding up. The number nobody has
reported is the one that decides whether Canon works for its declared use case:
violation rate as a function of session length.

This spec builds a real application in one long session and instruments it to
produce that number. The application is the byproduct; the measurement is the
deliverable. It is released as a free open-source tool for small businesses
because a real deliverable forces real decisions, and a demo does not.

## What gets built

`canon-stock`, an inventory manager for small businesses. Its own repository,
MIT licensed, UI in Spanish, README and code in English.

**Stack.** Vite, React, TypeScript. No router library, no state library. Three
runtime dependencies: react, react-dom, vite.

React was chosen deliberately over plain HTML. Plain HTML repeats markup on
every page, which spreads drift across more lines, but React is where Canon
actually gets used and it exercises a blind spot that plain HTML cannot reach:
`canon-lint` treats any JSX expression value as unverifiable. `data-variant={x}`
passes the linter no matter what `x` holds. A React codebase puts that escape
hatch under load and tells us how much it costs.

**Screens.** Six:

1. Product list, with search and sorting
2. Product create and edit
3. Stock movements, in and out
4. Low-stock alerts
5. CSV export
6. Settings

**Persistence.** `localStorage`, behind a `storage.ts` module exposing a small
interface (`list`, `get`, `save`, `remove`, `subscribe`). No other module
touches `localStorage` directly, so the storage layer can be swapped or tested
without touching the UI.

**Offline means no server.** No backend, no account, no cloud: the data lives
in the browser. The page itself is a static site and needs a network on first
load. No service worker. This is stated plainly in the README rather than
implied by the word "offline".

## Scope boundary

Not in scope: suppliers, categories, multiple users, permissions, reporting
dashboards, CSV import, barcode scanning, printing. Each of these is a
plausible next feature and none of them is needed to answer the question this
project exists to answer.

## How it is instrumented

A `drift-log.md` file at the root of the app repository, with one row for every
turn that creates or modifies a file. Turns that only discuss or read are not
logged.

| Field | Meaning |
|---|---|
| turn | Sequential turn number in the build session |
| context | Running context size, recorded in 25k-token bands rather than an exact count, since only the trend matters |
| files | Files created or modified |
| violations | New `canon-lint` violations, by rule |
| escapes | Times the vocabulary had no answer, and what was written instead |

Two rules govern the session:

1. **Violations are not fixed as they appear.** They are the data. Fixing them
   mid-session destroys the measurement, the same way a thermometer you keep
   resetting reports nothing.
2. **Escapes are recorded even when the linter is silent.** The more
   interesting failure is not breaking a rule, it is satisfying every rule by
   writing custom CSS for something the vocabulary does not cover. That output
   lints clean and still falsifies the thesis.

At the end of the session, two closing steps:

- **Repeat checkpoint.** The product list screen is regenerated from scratch,
  from the same one-paragraph spec used at turn 1, and compared structurally
  against the original. This measures drift directly rather than by proxy.
- **Cleanup commit.** Every accumulated violation is fixed in a single commit.
  The size of that diff is what the drift cost in real work.

## What gets measured

Three numbers, in order of how much they matter:

1. **Violations against turn number.** Answers the objection. If the curve is
   flat, Canon holds under long context. If it climbs after turn N, that N is
   the honest limit and belongs in the README.
2. **Cumulative vocabulary escapes.** Feeds the vocabulary admission criteria.
   A pattern that shows up as an escape here and in other consumers is a
   candidate for the vocabulary; one that appears once is not.
3. **Cleanup commit size.** Translates drift into hours, which is the unit the
   objection was raised in.

## Where each artifact lives

- The application: its own repository, linked from Canon's README as a
  real-world consumer.
- `drift-log.md` and the written conclusions: copied into the Canon repository
  as evidence. This is the reporting gap the reviewers identified, and it is
  currently empty.

The conclusions are published whatever they say. A drift curve that climbs is a
more useful result than no curve, and reporting only the flattering outcome
would repeat the exact methodological problem this spec was written to fix.

## Success criteria

This project is done when:

- The six screens work, data survives a reload, and the app is usable by
  someone running a small business.
- `drift-log.md` has a row for every turn of the build session.
- The three numbers above are computed and written up.
- The write-up is committed to the Canon repository, including the case where
  the result is unfavourable.

## Known limitations

- **One session, one model, one operator.** This is a single sample, not a
  study. It cannot separate "Canon holds up" from "this particular session went
  well". It is reported as what it is.
- **No control group.** Measuring the same application built with Tailwind plus
  a strict system prompt and a custom linter would isolate whether the closed
  vocabulary did the work or the prompt did. That is a separate, larger project
  and it is not attempted here.
- **The operator knows they are being measured.** Awareness of the instrument
  plausibly suppresses the effect being instrumented. Nothing in this design
  removes that bias, so the resulting number should be read as a floor on drift,
  not an estimate of it.
