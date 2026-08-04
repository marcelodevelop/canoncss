# Building what Canon does not have

Canon has fourteen components. Your product will need a fifteenth: a datepicker,
a kanban board, a file uploader with drag and drop, an onboarding wizard with
steps. Some of those will never be in Canon.

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
`data-size` with the same `sm|md|lg` values. If it has variants, take
`data-variant`. A reader who knows Canon should be able to read your component
without learning a second system.

Do not invent `data-x-spacing` or `data-x-padding-large`. That is a second
vocabulary, and two vocabularies is the problem Canon exists to avoid.

## Tokens, never values

Your CSS lives in `@layer canon.app` and is built from tokens:

```css
@layer canon.app {
  [data-x-component="datepicker"] {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
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
