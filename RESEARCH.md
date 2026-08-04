# How reproducible is LLM-generated UI?

**A measurement across three styling conditions, three page specs and 96
generations. August 2026.**

Ask a language model to build the same page twice and you get two different
pages. Everyone building with these tools knows this. Almost nobody has put a
number on it, which means nobody can tell whether an intervention helped.

This is an attempt at that number, the method for producing it, and six findings
that came out of it. One of them contradicts the project that ran the study, and
the last one is about the half of the work the first five never touched.

The tooling is open source and the whole corpus is in this repository. Every
figure below can be recomputed with one command.

---

## The question

"LLMs write inconsistent UI" is a claim about variance, not about correctness.
The output usually works. It is just not the same twice, and the differences
land in code review.

So the measurement has to compare generations to each other rather than to a
reference. Generate one spec N times, then ask how much any two runs share.

## The metric

`npm run repro` compares generations and reports two figures, never blended:

- **Structure**: the sequence of layout and component decisions. The skeleton.
- **Modifiers**: spacing, alignment, variants. Cosmetics.

They are kept apart because they mean different things. A run can score 96%
structure and 76% modifiers, and that is a good result rather than a mixed one:
the skeleton reproduced and the padding wobbled.

Comparison is by longest common subsequence rather than by position. An
inserted wrapper should cost one point, not shift every element after it. On
one early run, positional comparison scored 46% where subsequence scored 96%.
The wrong metric would have buried the finding.

For comparing across styling systems there is a framework-neutral mode. Counting
one system's attributes against another's class lists would punish the more
verbose one for being verbose, which is rigging the result. `--neutral` uses the
**element sequence** and the **set** of distinct styling decisions compared by
Jaccard, which normalises by vocabulary size rather than token count.

## The conditions

Three ways of styling the same page, each given the same specs, five
clean-context generations per cell.

1. **A closed vocabulary.** [Canon CSS](README.md), where the styling API is a
   fixed set of `data-*` attributes with enumerated values.
2. **Tailwind under a strict house style.** A prompt listing the permitted
   spacing steps, palette and verbatim class strings per component. Written to
   be as strict as Canon's and at comparable length, because a weak control
   proves nothing. In [`prompts/experiments/`](prompts/experiments/).
3. **Tailwind as teams actually brief it.** A competent prompt asking for
   consistent spacing, one palette, a type scale, semantics and accessibility,
   that simply does not enumerate the allowed values. That enumeration is the
   single variable under test.

## Results

Element sequence first, styling vocabulary second, both from the
framework-neutral mode so the rows are comparable to each other.

| Condition | Pricing page | Admin dashboard | Distinct decisions per page |
|---|---|---|---|
| Closed vocabulary | 90% / 90% | 90% / 91% | 41-43 |
| Tailwind, strict house style | 88% / 92% | 93% / 94% | 60-68 |
| Tailwind, realistic brief | 84% / 67% | 87% / 58% | 90-159 |

### Finding 1: the effect is real and large

Unconstrained generation agrees on **58% to 67%** of its styling vocabulary
across runs of one spec. Constrained generation reaches **90%**. It also takes
three times as many distinct decisions to say the same thing, and the spread
between runs is wide: one page used 90 distinct utilities and another 141, same
spec, same prompt.

Too many degrees of freedom does produce inconsistency, and the size of the
effect is not subtle.

### Finding 2: the architecture is not what fixes it

This is the result that goes against the framework that ran the study.

**Tailwind under a strict prompt matched the closed vocabulary, and beat it on
the second spec.** Compliance was tied at zero violations across 3811 class
uses. Two independent specs agree.

What does the work is the strictness of the specification, not the CSS
architecture underneath. A closed vocabulary is one way to write the
specification down. It is not the only one and, on these numbers, not a
measurably better one.

What it does buy is size. The same page in **41-43 styling decisions against
60-68**, a ratio that held on both specs. Equal reproducibility, a third less
surface to review. That is a diff-review argument, not a consistency one, and it
is smaller than the claim the project started with.

### Finding 3: a vocabulary gap is the measurable cause of divergence

At baseline the pairwise scores were not noisy, they were **bimodal**:
71/71/71/73/73/75 against 90/94/94/95. Two incompatible families of solution.

The cause was one missing thing. The spec asked for a collapsible FAQ; the
vocabulary had no disclosure component; some generations built cards and others
built bare prose. Adding the component collapsed the split and lifted the worst
pair from 71% to 86%.

Repeated on a second spec with a different gap, a sidebar navigation, and again
on a third. The third is the clearest: a multi-step checkout scored **82%
structure against 91%** for the other two specs, and five of five generations
named the same missing thing, a step indicator, then built it three different
ways. Three called it a stepper, one called it progress-steps, and one gave up
and faked it with a row of badges.

(That paragraph quotes the within-system metric, which is finer-grained than
the neutral one used in the table above. Both are reported by the same tool and
neither is mixed with the other in any comparison here.)

A gap in the vocabulary is not merely inconvenient. It is where the variance
comes from, and closing one is worth double digits.

### Finding 4: what models ask for stops predicting what they diverge on

This one has a practical consequence for anyone building tooling for agents.

Each generation was asked to report what the vocabulary could not express. Early
on those reports were useful. After the first real gap closed, they decoupled
from the measurement entirely.

Five generations asked for a footer component. Four of the five had already
written the identical footer without one:

```html
<footer data-layout="grid" data-cols="3" data-gap="xl" data-padding="xl">
```

They wanted a name, not a capability. Meanwhile the actual remaining divergence
was a wrapper around label-and-control pairs, present seven times in one
generation and zero in another, which no generation ever mentioned.

**Requests are cheap. Divergence is evidence.** This project now admits a
component only when generations build it differently, never when they ask for
it. That test has rejected two of four candidates so far, including one that was
requested across two different specs.

### Finding 5: aesthetics and structure can be genuinely separated

If a styling system separates brand from structure, how much does the brand
leak into the markup? Told a brand is austere and dense, does a model start
reaching for tighter gaps?

Two brands as far apart as they could be made, three generations each, each
writing its own theme file. One institutional, navy and square-cornered; one
warm, coral and very rounded.

| Comparison | Structure |
|---|---|
| Within one brand | 96-97% |
| **Across the two brands** | **93-97%** |

Structure across opposite brands is as stable as within one brand, and both are
above the unbranded baseline. The themes diverged almost completely: 49 tokens
overridden each, only two landing on the same value.

Maximum aesthetic divergence, unchanged skeleton. This is the one result a
utility-class system cannot reproduce by construction, because there the brand
and the markup are the same artefact: change the look and every element has been
rewritten.

### Finding 6: the gap is not in writing a page, it is in changing one

Finding 2 gave the reproducibility argument away: a strict prompt over Tailwind
generates as consistently as a closed vocabulary does. That result is about
writing a page from nothing, which is the rarer half of the work. The other half
is changing a page that already exists, and nothing above measures it.

So: take one generated page per condition, hand it to three clean-context agents
with the same change request, and measure how much of the file comes back
rewritten. Two requests, chosen so that one of them is a control the closed
vocabulary has no reason to win.

`npm run repro -- --churn` reports styling decisions rewritten and lines changed,
each normalised by the base file so a verbose system is not charged for being
verbose.

| Change requested | Condition | Decisions rewritten | Lines changed |
|---|---|---|---|
| Tighten the vertical rhythm one step | Closed vocabulary | **8%** (5-6 of 142) | **16%** |
| Tighten the vertical rhythm one step | Tailwind, strict house style | **16%** (21-29 of 295) | **32%** |
| Add a testimonials section | Closed vocabulary | 20% (28-30 added) | 18% |
| Add a testimonials section | Tailwind, strict house style | 20% (57-64 added) | 22% |

**The control comes out level, and that is what makes the first row worth
reading.** Adding a section is new markup either way; both conditions land on
20% and neither touched a single decision outside the request. There is no
general editing advantage.

The cross-cutting change is a factor of two, on both measures and in the same
direction on all three runs. In absolute terms it is five or six edits against
twenty-one to twenty-nine, for an identical intent.

#### Why, and it is not the part we expected

The mechanism turned up in the control's own output. Two of the three Tailwind
runs reported, unprompted, that they could not make the change without breaking
the house style, because its spacing is baked into verbatim class strings that
rule 3 says to copy exactly. They were right, and the files show it:

| Verbatim pattern | Uses before | After the density edit |
|---|---|---|
| `py-12` (Centered page) | 4 | 0, 0, 0 |
| `p-6` (Card) | 7 | 1, 1, 1 |

A routine density request deleted the style guide's own patterns from the page.
The third run avoided that by declining to tighten the FAQ block at all, leaving
the request half done. Both outcomes are failures, and there was no third option
available.

This sharpens Finding 2 rather than overturning it. A strict prompt buys
reproducibility by freezing literal strings, and a frozen literal string cannot
be reparameterised later: the property that makes generation consistent is the
same property that makes the next change destructive. A closed vocabulary
freezes the *names* and leaves the values enumerated, so the same request moves
values inside a vocabulary that survives it. The Canon runs came out lint-clean
with the vocabulary intact.

The honest scope of the claim: no advantage when adding, half the diff when
changing something that crosses the page, and a style guide that is still there
afterwards.

---

## Limitations

Stated plainly, because the findings are only as good as these.

- **Five generations per cell.** A four-point move is inside the noise and no
  causal claim is made about one. Only the double-digit effects are argued.
- **One model, one operator.** This measures these conditions under one setup,
  not language models in general.
- **Three specs, and two of them are the same shape.** Pricing and dashboard are
  both sections stacked down a page. They agreed with each other at 90% and hid
  a gap that a third shape, a multi-step checkout, found on its first run. A
  reproduction figure is only as broad as the shapes it was measured on, and
  these were narrower than the number suggested.
- **The strict Tailwind control was improvised.** Its allowed set had no
  text-alignment utilities, no responsive variants, and a dark background with
  no matching dark text colour, so several generations dropped dark mode. That
  is a fault of the control. The figures came out level anyway, so the
  conclusion does not rest on it.
- **The operator knew what was being measured.** Read the numbers as a floor.
- **Finding 6 is one base page per condition, two requests, n=3.** The base is
  `gen-1` of each reproduction run, not an average of five. A different base
  could move the percentages; it is harder to see how it would move the
  verbatim-pattern count, which is a property of the house style rather than of
  the page.
- **Finding 6's edits were told not to reformat.** Without that instruction line
  churn measures tidying as much as editing. It applied equally to both
  conditions, but it does mean the line figures are a floor on a real diff.

## Reproducing this

```bash
git clone https://github.com/marcelodevelop/canoncss
cd canoncss && npm test          # validates the whole corpus
npm run repro -- test-llm/repro-pricing-v4/gen-*.html            # within one system
npm run repro -- --neutral test-llm/control-tailwind/gen-*.html  # across systems

# Finding 6: how much of the page an edit rewrites
npm run repro -- --churn test-llm/repro-pricing-v4/gen-1.html test-llm/edit-density/canon-*.html
npm run repro -- --churn test-llm/control-tailwind/gen-1.html test-llm/edit-density/tailwind-*.html
```

Every generation is in [`test-llm/`](test-llm/), with
[a guide to what each directory is](test-llm/README.md). The prompts for all
three conditions are in [`prompts/`](prompts/) and
[`prompts/experiments/`](prompts/experiments/). The metric is
[`scripts/repro.mjs`](scripts/repro.mjs), about 200 lines with no dependencies
and a self-check that runs in CI.

Nothing here is specific to one framework. The neutral mode was built to
measure Tailwind and it did.

## What we changed because of it

The project that ran this study rewrote its own pitch on the results. It no
longer claims to fix LLM inconsistency, because Finding 2 says a strict prompt
over an existing framework does that too. It claims to be that specification
already written, mechanically checked, and about a third the size, which is what
the numbers actually support.

Finding 6 added the one thing to that list that a prompt cannot supply. A
specification you write in a prompt is enforced only while the model is reading
it; the first cross-cutting change edits the specification out of the page. A
specification written as a vocabulary survives its own edits, and there is a
linter to prove it did.

Publishing the result that contradicts you is the only reason to trust the ones
that do not.
