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

It was then run a second time on the dashboard spec, because concluding from
one spec is the exact overfitting mistake this corpus already caught once.

| | Canon | Tailwind, strict prompt |
|---|---|---|
| Pricing, element sequence | 90% | 88% |
| Pricing, styling vocabulary | 90% | **92%** |
| Dashboard, element sequence | 90% | **93%** |
| Dashboard, styling vocabulary | 91% | **94%** |
| Distinct decisions per file | 41-43 | 60-68 |
| Violations of its own rules | 0 | 0 |

**Tailwind matched Canon on the pricing spec and beat it on the dashboard, on
both measures.** Compliance was tied at zero across 3811 class uses. The second
run did not rescue the thesis; it made the result firmer and slightly worse.

### The third condition, and what it restores

The strict control handed the model verbatim class strings per component, which
is Canon's own approach wearing a Tailwind costume. Almost nobody works that
way. So a third condition was run: a competent brief with no closed vocabulary,
the kind a good team actually writes. It asks for consistent spacing, one
palette, a type scale, semantics, accessibility and responsiveness. It just
does not enumerate the allowed values, which is the single variable under test.

| Condition | Pricing | Dashboard | Decisions per file |
|---|---|---|---|
| Canon | 90% / 90% | 90% / 91% | 41-43 |
| Tailwind, strict house style | 88% / 92% | 93% / 94% | 60-68 |
| **Tailwind, realistic brief** | **84% / 67%** | **87% / 58%** | **90-159** |

Element sequence first, styling vocabulary second.

Against Tailwind as it is actually briefed, Canon agrees on **90% of its
styling vocabulary where Tailwind manages 58 to 67**, and does it in **41 to 43
decisions per page against 90 to 159**. Three times the surface, a third of the
agreement, and the spread between generations is enormous: one page used 90
distinct utilities and another 141 for the same spec.

So the founding diagnosis is not just plausible, it is now demonstrated. Too
many degrees of freedom does produce inconsistency, and the effect is large.

What the strict control adds is the honest limit on the remedy: **a closed
vocabulary is not the only fix.** Writing down the vocabulary works too. Canon's
case is that it is that written vocabulary, already done, mechanically checked,
and about a third the size.

### What that means

The honest reading is that **the strictness of the specification is doing the
work, not the CSS architecture.** A constrained prompt over Tailwind reaches
the same place as a closed vocabulary. What it does not do is get there for
free: that prompt has to be written, agreed, and kept from rotting, and the
realistic condition above shows what happens when it is not.

Two real differences remain, and they are smaller than the original pitch:

1. **Canon carries about a third fewer styling decisions per file** for the
   same page: 41-43 against 60-68, and that ratio held on both specs. Equal or
   slightly worse reproducibility, but a third less surface to review. This is
   the one advantage that replicated, and it is a diff-review argument, not a
   consistency one.
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
