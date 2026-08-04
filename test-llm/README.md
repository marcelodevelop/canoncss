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

## Limitations

- Five generations per round is a small sample. A four point move is inside
  the noise, and no causal claim is made about one.
- One model, one operator. This measures Canon under the conditions it was run
  in, not Canon in general.
- No control group. The same specs built with Tailwind, a strict system prompt
  and a custom linter would separate "the closed vocabulary worked" from "the
  prompt worked". That has not been attempted.
- Values written as JSX expressions cannot be compared, so a score on a React
  codebase covers less than one on HTML. `canon-lint` reports that coverage;
  `repro` reports it too.
