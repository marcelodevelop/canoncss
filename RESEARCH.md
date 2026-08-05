# How reproducible is LLM-generated UI?

**A measurement across three styling conditions, three page specs and 114
generations. August 2026.**

Ask a language model to build the same page twice and you get two different
pages. Everyone building with these tools knows this. Almost nobody has put a
number on it, which means nobody can tell whether an intervention helped.

This is an attempt at that number, the method for producing it, and seven findings
that came out of it. One of them contradicts the project that ran the study, and
the last two are about the half of the work the first five never touched.

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
with the same change request, and measure what comes back. Four requests across
two specs, deliberately including kinds of change the closed vocabulary has no
reason to win.

`npm run repro -- --churn` reports the count of styling decisions touched and the
share of lines changed.

| Spec | Change requested | Closed vocabulary | Tailwind, strict |
|---|---|---|---|
| Pricing | Tighten the vertical rhythm | **5-6** changed, 16% lines | **21-29** changed, 32% lines |
| Dashboard | Tighten the vertical rhythm | **3-4** changed, 3% lines | **8** changed, 11% lines |
| Pricing | Add a testimonials section | 28-30 added, 18% lines | 57-64 added, 22% lines |
| Pricing | Remove the middle plan | 21 removed, 13% lines | 42 removed, 12% lines |

The decision figure counts values, not diff hunks: a value that moved from `lg`
to `md` is one changed decision, an inserted one is one addition. The tool prints
additions and removals separately for that reason, because summing them would
count every modification twice.

Two of the four rows are controls and both come out level. Adding a section and
removing a plan are the same work in either system: on the removal, all six runs
produced byte-identical decisions and every one of them touched exactly one thing
outside the deleted block, the grid column count going from three to two. **There
is no general editing advantage.** The cross-cutting change is where the systems
separate, and it separates on both specs.

#### The number that did not replicate, and why

The first version of this section reported the density result as a percentage of
each file's styling decisions: 8% against 16%. That number inverts on the
dashboard, where the same comparison reads 6% against 4% and appears to say the
closed vocabulary lost.

It is the metric that is wrong. Dividing by the base file's own token count
divides by a number that differs about fourfold between the two systems, so the
more verbose system scores better for being verbose. Eight edits out of 391 is
4%; three edits out of 104 is 6%. The count and the line figure both say the
same thing on both specs, and the percentage says the opposite on one of them.

`--churn` now prints the count first and says in its own output not to compare
the percentage across systems. This is the second time in this corpus that
running a second spec has caught a conclusion drawn from one.

#### The mechanism, which did replicate

Two of the three Tailwind runs on the pricing spec reported, unprompted, that
they could not make the change without breaking the house style, because its
spacing is baked into verbatim class strings that rule 3 says to copy exactly.
They were right, and both specs show it:

| Verbatim pattern | Pricing: before, after | Dashboard: before, after |
|---|---|---|
| `py-12` (Centered page) | 4 → 0, 0, 0 | 1 → 0, 0, 0 |
| `p-6` (Card) | 7 → 1, 1, 1 | 6 → 1, 1, 2 |

A routine density request deleted the style guide's own patterns from the page,
in six runs out of six across two specs.

The enforcement written for this study does not see it.
`scripts/check-tailwind-control.mjs` found zero violations across 3811 class uses
at generation time, and on the six edited files it reports `0 of 2058 class uses
(0%) are not in the declared set`. The edit stayed inside the allowed utilities
while dismantling the component patterns built out of them.

#### The claim that was drawn from that, and was wrong

The first version of this section concluded that a house style's component
patterns are not mechanically enforceable, and that this is why the closed
vocabulary is the enforceable one. That is a strong claim resting on a checker
nobody had written, so the next step was to write it and try to refute the
finding.

It refutes it. [`check-tailwind-patterns.mjs`](scripts/check-tailwind-patterns.mjs)
is about a hundred lines. It splits each pattern into the distinctive classes
that identify it and the spacing it must carry, treats any element holding the
whole signature as that component, and checks the spacing. On the ten unedited
control files it flags **1 case in 272 identified patterns**, and that one looks
real rather than spurious. On the six edited files it flags **39**, naming every
`Card` that lost its `p-6` and every `Centered page` that lost its `py-12`.

**Rule 3 is enforceable. It simply had not been enforced.** The reason the
structural argument failed is worth stating: the density edit changed only the
spacing classes and left the identifying ones alone, so the element was still
recognisable as a card afterwards. Identity survived because the edit did not
touch it.

#### Where it does go blind, stated at its real size

That last sentence is the whole of what survives. Take the same control page and
rebrand it, `bg-teal-700` to `bg-indigo-700`, which is an identifying class of
the Button primary pattern rather than a spacing one. The three primary buttons
are still in the file. The checker's identified count falls from 18 to 15 and it
reports **clean**, because a button it can no longer recognise is indistinguishable
from a button that was never there.

So the honest residual is narrow: an enforcement built on class strings catches
edits to the parts of the pattern that do not identify it, and cannot see edits
to the parts that do. Naming the component separately from styling it, which is
what `data-component="card"` does, is what removes that hole. That is a real
property and a much smaller one than "the patterns cannot be checked".

#### What the closed vocabulary actually buys, stated narrowly

It is not that Canon can make the change and Tailwind cannot. **Both systems hit
a floor.** On the dashboard the Canon runs said so explicitly: eight of that
page's fifteen gaps were already at `xs`, and the base carried no `data-padding`
at all, so two of three agents reported that "the space inside cards" could not
be tightened without leaving the vocabulary. Part of Canon's low edit count on
that spec is a request it declined to finish.

The difference is what happens at the floor. Canon's runs stopped, said which
part they could not do, and came out lint-clean. The Tailwind runs went through
it, and nothing in the toolchain registered that anything had happened, until
this study wrote the checker that does.

So the claim is narrower than the first draft of this section made it, and
narrower again after the refutation:

- On cross-cutting change, roughly half the edits and a third to a half the diff,
  on two specs, with the magnitude unstable between them.
- On additive and subtractive change, no difference at all.
- Ordinary editing does dismantle a prompt-written specification, unanimously,
  six runs of six across two specs.
- But that is **catchable**, by about a hundred lines nobody had written. The
  advantage is that Canon ships the linter, not that Tailwind cannot have one.
- The only part that is structural rather than a matter of who wrote what: an
  enforcement built on class strings goes blind exactly where an edit changes the
  classes that identify a component, and a vocabulary that names components apart
  from styling them does not have that hole.

That last point is the floor. It is a good deal smaller than the claim this
project started with, and it is the one that has survived every attempt so far to
knock it over, including this one.

### Finding 7: after a restyle, only one of the two systems still knows what the page is made of

The floor above rested on a single synthetic test, one file with `bg-teal-700`
replaced by hand. That is the weakest evidence in this document supporting the
last claim left standing, so it was run properly: three clean-context agents per
system, one base page each, the same request.

> Design update: the cards should read as flat panels rather than outlined
> boxes. Drop the outline, give them a subtle grey fill, and round the corners
> more. Nothing else about the page changes.

The measurement is not churn. It is a census: **the page has three cards before
and three cards after, so how many can each system's tooling still find?**

| | Closed vocabulary | Tailwind, strict |
|---|---|---|
| Cards actually on the page, after | 3 | 3 |
| Cards the tooling can find, before | 3 | 3 |
| **Cards the tooling can find, after** | **3, 3, 3** | **0, 0, 1** |
| Its checker's verdict, after | clean | clean, 0 violations |
| Patterns it can identify at all, after | unchanged | 18 → 15, 15, 16 |
| Lines of markup touched | 1, 1, 1 | 2 to 3 elements |

The one Tailwind run that finds a card is the one whose agent deliberately kept
the featured card's teal outline, reasoning that removing it would erase which
plan is recommended. The other two flattened all three and the census went to
zero. **`check-tailwind-patterns.mjs` reports clean on all three**, because a
card it can no longer recognise is not a card it can check.

#### The mechanism is in the control's own rules, not in the framing

The obvious objection is that this compares a CSS change against a markup change.
It does, and the reason is rule 2 of the house style: *no inline styles, no
`<style>` blocks, no custom CSS*. A restyle has nowhere to go but the class
attributes. That is the control's own text, written to make it a strong control,
and it is what makes the component patterns and the styling the same artefact.

All three Canon runs routed the change into a stylesheet instead and left the
markup alone: **one added line, the `<link>`, and not a single attribute
touched.** `canon-lint` came back clean and reported `1 rule in @layer canon.app`,
which is the escape hatch counting itself.

#### What it costs, on both sides

All three Tailwind runs reported that "round the corners more" was not
expressible: the radius scale has no step between `rounded-lg` and
`rounded-full`. That is the control hitting a floor of its own, the same way the
dashboard found Canon's in Finding 6.

And Canon did not express this in its vocabulary either. It has no modifier for
outline, fill or radius on a card, so all three runs went to the app layer. The
difference is that the app layer is a declared, linted, counted place to go, and
the census survives the trip.

This is the first result in this sequence that did not shrink when it was
attacked. Three attempts to knock the previous ones down all succeeded to some
degree. This one predicted the numbers in advance and got them.

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
- **Finding 6 is one base page per spec, four requests, n=3.** The base is
  `gen-1` of each run, not an average of five. A different base could move the
  edit counts; it is harder to see how it would move the verbatim-pattern count,
  which is a property of the house style rather than of the page.
- **Finding 6's density result is two specs, and they disagree on magnitude.**
  The direction is the same on both, the size is not: pricing is a factor of
  four on edits, the dashboard a factor of two. Read it as "roughly half or
  better", not as a coefficient.
- **Finding 7 is one spec, one base page, n=3, and one request.** It is the
  cleanest result here and it is also the youngest. The census gap is large
  enough that noise is not a plausible explanation, but a second spec has now
  overturned a conclusion in this document twice, so treat it as provisional
  until it has one.
- **Finding 7 compares a CSS change to a markup change**, because rule 2 of the
  control forbids custom CSS and Canon's card has no markup knob for fill or
  radius. Both systems were given the identical request and routed it where
  their own rules allow. That routing is the finding rather than a flaw in it,
  but a house style that permitted a stylesheet would not behave this way.
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
npm run repro -- --churn test-llm/repro-dashboard-v3/gen-1.html test-llm/edit-density-dash/canon-*.html
npm run repro -- --churn test-llm/control-tailwind-dashboard/gen-1.html test-llm/edit-density-dash/tailwind-*.html
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
