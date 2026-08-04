# The corpus

Every page here was written by an LLM given only `prompts/system-prompt.txt`
and a one-paragraph spec, with no access to the rest of this repository. They
are evidence, not examples: `npm test` lints all of them on every change, so a
vocabulary edit that would break real generated markup fails CI.

## What each directory is

| Path | What it is |
|---|---|
| `*.html` at the root, `v2/`, `v3/` | The original regression corpus. Different specs, generated during early prompt iterations. |
| `site-relay/` | A seven-page product written by seven agents that never saw each other's output. Tests cross-page consistency. |
| `repro-pricing*`, `repro-dashboard*` | Reproduction runs. Five clean-context agents given the **same** spec, so the outputs can be compared to each other. Numbered rounds correspond to prompt versions. |
| `violations-fixture.html` | Deliberately broken. `npm test` fails if the linter stops catching all six violations. |

## Reproduction: the number that matters

Zero violations proves the model follows the rules. It does not prove the
thesis, which is that a closed vocabulary makes the model produce *the same
thing*. That needs a different measurement: generate one spec several times and
compare the outputs to each other.

`npm run repro -- <files>` does this. It reports two figures and never blends
them, because they mean different things:

- **structure** (`data-layout`, `data-component`, `data-slot`) is the skeleton.
  This is what the closed-vocabulary claim is actually about.
- **modifiers** (`data-gap`, `data-align`, `data-variant`, ...) are cosmetics.
  Movement here changes how a page looks, not what it is.

### Results, August 2026

Five clean-context generations per round, ten pairwise comparisons each.

| Round | Change | Pricing spec | Dashboard spec |
|---|---|---|---|
| Baseline | - | 81% / 70% | 82% / 67% |
| 2 | `disclosure` component added | 92% / 79% | - |
| 3 | canonical defaults in the prompt | 95% / 84% | - |
| 4 | `nav` component added | - | 88% / 72% |
| 5 | canonical pairing in the prompt | 91% / 82% | 91% / 74% |

Structure first, modifiers second.

### What these numbers actually showed

**A vocabulary hole is the measurable cause of structural variance.** At
baseline the pairwise scores were bimodal, 71/71/71/73/73/75 against
90/94/94/95. Two incompatible families, not noise. The cause was the FAQ: with
no collapsible component, some generations built cards and others built bare
prose. Adding `disclosure` collapsed the split and lifted the worst pair from
71% to 86%.

**Tuning against one spec buys that spec.** Round 3 reached 95% on pricing. The
same prompt scored 82% on a dashboard, which is baseline. The gain had not
generalised, and reporting it as a general result would have been wrong.

**Agent complaints stop predicting divergence once the first real gap closes.**
The remaining dashboard spread was a `data-layout="stack"` wrapper around
label-and-control pairs, present seven times in one generation and zero in
another. No agent ever mentioned it, while several asked for a footer component
that four of five had already built identically.

That observation is why `CONTRIBUTING.md` admits a component on divergence
rather than on request. Two of four candidates from these runs were rejected.

## The control group

The obvious objection to everything above: those numbers show Canon is
consistent, not that the *closed vocabulary* is why. A strict prompt might do
the same work with any styling system.

So the same pricing spec was generated five more times with Tailwind, given a
house-style prompt written to be as strict as Canon's and at comparable length:
a fixed spacing scale, a fixed palette, and verbatim class strings for each
component pattern. A weak control proves nothing, so this one was steelmanned.

Comparing the two needs a framework-neutral metric, because counting Canon's
`data-*` values against Tailwind's class lists would punish Tailwind for
verbosity alone. `npm run repro -- --neutral` uses two measures that do not
depend on the styling system: the **element sequence**, and the **set** of
distinct styling decisions compared by Jaccard, which normalises by vocabulary
size rather than token count.

| | Canon | Tailwind, strict prompt |
|---|---|---|
| Element sequence | 90% | 88% |
| Styling vocabulary | 90% | **92%** |
| Distinct decisions per file | 42-43 | 60-67 |
| Violations of its own rules | 0 | 0 |

**Tailwind matched Canon on every dimension measured here**, and beat it
slightly on styling agreement. Compliance was tied at zero, over 1763 class
uses.

### What that means

The honest reading is that **the strictness of the specification is doing the
work, not the CSS architecture.** Canon's founding claim, that too many degrees
of freedom is the problem, survives. The claim that a new framework is the
answer does not: a constrained prompt over an existing one reached the same
place.

Two real differences remain, and they are smaller than the original pitch:

1. **Canon carries about 30% fewer styling decisions per file** for the same
   page, 42 against 63. Equal reproducibility, less surface to review. That is
   the diff-review argument, and it is the one that survives.
2. **Canon ships the specification and the linter.** The Tailwind condition
   needed both written by hand: the house style is in
   `prompts/experiments/tailwind-control.txt` and its checker in
   `scripts/check-tailwind-control.mjs`. The checker took sixty lines, so this
   is a distribution advantage, not a technical one.

### Where the control was unfair, in both directions

Against Tailwind: the allowed set was improvised, and the agents said so. It
had no text-alignment utilities, no responsive variants, and a `dark:` variant
for backgrounds with no matching text colour, so several generations dropped
dark mode rather than ship unreadable contrast. Canon's vocabulary is closed
but was designed to be complete enough to finish a page. That gap is a fault of
the control, not evidence for Canon.

In Canon's favour: the reproduction figures still came out equal despite that,
so the conclusion is not sensitive to it.

## Limitations

- Five generations per round is a small sample. A four point move is inside
  the noise, and no causal claim is made about one.
- One model, one operator. This measures Canon under the conditions it was run
  in, not Canon in general.
- The control group is a single spec and five generations per side. It is
  enough to refute "only a closed vocabulary can do this" and not enough to
  rank the two systems.
- Values written as JSX expressions cannot be compared, so a score on a React
  codebase covers less than one on HTML. `canon-lint` reports that coverage;
  `repro` reports it too.
