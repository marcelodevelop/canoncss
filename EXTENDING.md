# Building what Canon does not have

Canon has seventeen components. Your product will need an eighteenth: a
datepicker, a kanban board, a file uploader with drag and drop, an onboarding
wizard with steps. Some of those will never be in Canon.

This is how you build them so they still look and read like Canon. It is a
supported path, not a workaround, and `canon-lint` checks it.

## First, check that you actually need one

The cheapest extension is the one you do not write. Canon's own admission test
turned up a useful pattern: people ask for components they have already built
identically without them.

Five agents given the same page all asked for a footer component. Four of the
five had written the exact same thing without it:

```html
<footer data-layout="grid" data-cols="3" data-gap="xl" data-padding="xl">
```

They wanted a name, not a capability. Before extending, try to build it from
layouts and see whether the result is actually worse.

## The namespace

An extension takes `data-x-component`, not `data-component`. The vocabulary
stays closed and yours stays visibly yours.

```html
<div data-x-component="datepicker" data-padding="md">
  <div data-x-slot="month">March 2026</div>
  <div data-x-slot="grid">…</div>
</div>
```

Rules `canon-lint` enforces:

- **kebab-case.** `data-x-component="Card"` fails.
- **No shadowing.** `data-x-component="button"` fails and tells you to use the
  real one.
- **It has to be styled.** An extension used in markup with no rule in any
  `@layer canon.app` fails, because it renders bare and nothing else would tell
  you.

It also lists your extensions on every run, and names any you declared in CSS
but never used.

## Borrow the modifiers, do not invent them

This is the part that decides whether your component feels like Canon or like a
guest. Canon's modifiers are token-driven, so they already work on your element:

```html
<div data-x-component="datepicker" data-padding="lg" data-gap="sm">
```

Use `data-gap`, `data-padding`, `data-align`, `data-justify`, `data-tone`,
`data-hide` and `data-motion` as they are. If your component has sizes, take
`data-size` with the same `sm|md|lg` values. A reader who knows Canon should be
able to read your component without learning a second system.

When Canon does not have the value you need, use `data-x-variant` and
`data-x-state`, which take any kebab-case value. A calendar day is
`unavailable` and no closed set was ever going to predict that. Do not reach
for `data-variant="unavailable"`: Canon's modifiers keep Canon's values, and
the linter will tell you so.

Its regions are `data-x-slot`, not `data-slot`, for the same reason.

Do not invent `data-x-spacing` or `data-x-padding-large`. Spacing already has a
vocabulary. A second one is the problem Canon exists to avoid.

## Tokens, never values

Your CSS lives in `@layer canon.app` and is built from tokens:

```css
@layer canon.app {
  [data-x-component="datepicker"] {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--space-xs);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  [data-x-component="datepicker"] > [data-x-slot="month"] {
    grid-column: 1 / -1;
    font-weight: var(--weight-medium);
  }
}
```

`canon-lint` fails on a hardcoded colour or a hardcoded padding, margin, gap or
font-size inside that layer, because those are exactly what the theme system
controls. A border width, a grid template, a transform: those are yours and
nobody is checking them.

The reason is the retargeting result. Two opposite brands, each overriding 49
tokens, produced markup 96% structurally identical. That only holds while
everything on the page reads its colour and spacing from tokens. One hardcoded
value is a component that ignores the brand.

Spell the layer name exactly. `@layer canon.apps` is valid CSS and still
renders, because a layer nothing declared sorts after every layer that was, so
there is nothing to see. But it is no longer the escape hatch: none of the
checks above run on it, the extensions inside it stop counting, and the rule
total below reads zero. R11 catches that and suggests the name you meant. Your
own layers, anything outside the `canon.*` namespace, are left alone.

## The layer is counted, not hidden

Every run prints how many rules you have there:

```
✓ 12 files clean
  9 rules in @layer canon.app. That is what the vocabulary does not cover here.
  2 extension components: datepicker, kanban-board
```

That number is meant to be read. A small app layer means Canon fits your
product. A large one means it does not, and that is a bug report rather than
your problem to live with.

## A worked one you can take

```bash
npx -p canoncss canon-init --extension date-field
```

`date-field` is a reference build of the thing this document keeps using as its
example. Not vocabulary: it lands in your repo and is yours to change, the same
deal as a theme.

It is worth reading before you write your own, because it is the shape the
generated versions kept missing. Four agents asked to build a calendar all
produced a month-sized block sitting inline in the page. That is not what a
date picker is: it reflows the form every time it opens, and it dominates a
layout it should be a control inside. `date-field` is a `<details>` popover in
the shape of an input, floating over the page, with the month grid inside.
Still zero JavaScript, still the same mechanism as the topbar burger.

Two small decisions in it are worth stealing. Unavailable days are muted rather
than struck through, because a line through a number reads as an error and an
unavailable day is simply not on offer. And the radio input is moved offscreen
rather than hidden with `display: none`, which would have dropped it out of the
tab order and taken the keyboard with it.

Writing it also caught the author: `gap: 2px` between the day cells failed R6,
correctly. Cell spacing is spacing, a roomier brand should get more of it, and
`var(--space-xs)` is what it should have been.

## Getting it into Canon

If a pattern shows up in several independent app layers, propose it. The bar is
in [CONTRIBUTING.md](CONTRIBUTING.md) and it is deliberately not "several people
asked": a component earns its place when generations **diverge** without it.
Both components added in 0.2.0 cleared that bar, and two candidates were
rejected by it.

Open an issue with the vocabulary proposal template and say what you built,
what you tried first, and what the alternatives were.

## The shape of the rule

> This is the way it is written. It is not the limit of what you can write.

The closed vocabulary is about having one right way to say the things Canon
covers, not about pretending it covers everything.

## How this was arrived at

Everything above was measured, not reasoned. The namespace was designed first
and tested an hour later: four clean-context agents were given a booking page
needing a calendar and a drag-and-drop uploader, neither of which Canon has.

The first run produced **24 violations**, and 22 of them were the same mistake:
agents wrote `data-variant="unavailable"` on a calendar day. They were doing
exactly what this document told them to do, reuse Canon's modifiers, and the
linter punished them for it because `data-variant` holds Canon's closed value
set. The guidance and the rule contradicted each other, and only a real
generation surfaced it.

None of them used `data-x-slot` either, because the short prompt described the
namespace without mentioning it. So they fragmented one calendar into
`calendar`, `calendar-grid`, `calendar-day` and `calendar-weekday` as siblings,
purely to have somewhere to hang the names.

With `data-x-variant`, `data-x-state` and `data-x-slot` in the prompt, the same
spec produced **zero violations**, and the extension names converged: `calendar`
and `dropzone` in every generation, against six competing names before.

The missing slot vocabulary was causing component fragmentation. That is not
something you find by thinking about it.
