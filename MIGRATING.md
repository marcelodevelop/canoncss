# Migrating from Tailwind

This is a working procedure, not a pitch. Read
[RESEARCH.md](RESEARCH.md) first if you have not decided yet: it publishes the
condition where Canon loses.

Everything below is measured on two corpora in [`test-llm/`](test-llm/): the
same two specs, a pricing page and an admin dashboard, generated five times
each under a competent Tailwind house-style prompt and five times each under
Canon. Regenerate any number here with `npm run census`.

## The shape of the job

| | Tailwind | Canon |
|---|---|---|
| distinct styling vocabulary | 286 distinct classes | 63 distinct pairs |
| total styling decisions | 7,151 uses | 1,038 uses |
| per page | 715 | 104 |

So the job is mostly deletion. That is the thing to internalise before you
start, because it changes the method: you are not looking for the Canon
equivalent of each class, you are finding the element each pile of classes was
describing and naming it.

## What each pile of classes turns into

| What it styles | Classes | Uses | Share | In Canon it becomes |
|---|---|---|---|---|
| spacing | 41 | 1,399 | 19.6% | data-gap, data-padding, or the component |
| type | 18 | 1,254 | 17.5% | the element and the type scale |
| text colour | 21 | 1,032 | 14.4% | the component, or data-tone |
| flex and grid | 23 | 954 | 13.3% | data-layout |
| focus rings | 24 | 608 | 8.5% | nothing: the reset does it |
| background | 22 | 411 | 5.7% | the component, or the theme |
| border | 12 | 342 | 4.8% | the component |
| radius | 6 | 306 | 4.3% | the component, or --radius-* in the theme |
| size | 27 | 205 | 2.9% | data-width, data-full, or the component |
| everything else | 92 | 640 | 8.9% | case by case |

Two rows are worth pausing on.

**Focus rings are 8.5% of the styling and all of it disappears.** The corpus
writes `focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600
focus-visible:ring-offset-2` on every interactive element, 608 uses, to rebuild
a focus indicator it turned off on the previous class. Canon's reset ships one
`:focus-visible` rule and you write nothing. If you find yourself porting a
focus ring, stop: you are porting a workaround.

**Text colour is 14.4% and almost none of it survives.** `text-slate-600` on a
paragraph is what the paragraph already is. Colour that carries meaning becomes
a component (`data-component="badge" data-variant="error"`) or, for prose that
is genuinely secondary, `data-tone="subtle"`. Colour that was decoration was
never information and goes.

## Order of operations

Do it in this order. Each step makes the next one smaller, and going out of
order means porting classes you are about to delete.

**1. Put the stylesheet in and take Tailwind out of one page.** Not the whole
app. One page, one branch. Canon is a single file with no build step, so this
is a `<link>` and a deletion.

```bash
npx -p canoncss canon-init
```

**2. Name the components before touching anything else.** Walk the page and
mark what each region *is*: this is a card, this is a topbar, that is a badge.
Do not convert yet. Most of the class piles are attached to these, and naming
them tells you which piles evaporate.

**3. Convert layout, then components, then modifiers.** Layout first because it
is structural and the rest hangs off it. `flex flex-col gap-4` is
`data-layout="stack" data-gap="md"`. A `grid grid-cols-3 gap-6` is
`data-layout="grid" data-cols="3" data-gap="lg"`.

**4. Delete every class that is now doing nothing.** This is the step people
skip, and skipping it leaves a page that is styled twice and drifts the first
time somebody edits it. `canon-lint` will not catch a leftover Tailwind class,
because it is not a Canon rule violation, so grep for `class=` when you think
you are done.

**5. Move the brand into `theme.css`.** Your `indigo-600` is `--color-brand`.
Your `slate-200` is `--color-border`. This is the file that keeps the page
looking like your product, and it is the only file that should differ between
brands. It is also where the migration pays: two opposite themes over the same
markup measured 96% structurally identical.

**6. Whatever is left goes in `@layer canon.app`.** Built from tokens. Read
[EXTENDING.md](EXTENDING.md) before writing anything there, and keep the count
small: `canon-lint` prints it on every run, and it is the measurement of what
Canon is missing for your product.

## Worked examples, from the corpus

Both sides are real generations, not written for this document.

A primary call to action:

```html
<!-- Tailwind -->
<a href="#signup" class="inline-flex items-center justify-center rounded-lg
   bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700
   focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600
   focus-visible:ring-offset-2">

<!-- Canon -->
<a data-component="button" data-variant="primary" href="/signup">
```

Fifteen classes to one role and one variant. The hover state, the focus ring,
the radius, the weight and the padding are all the button's job, and
`indigo-600` moved to `--color-brand` where changing it changes every button at
once.

A pricing card:

```html
<!-- Tailwind -->
<article class="flex h-full flex-col rounded-2xl border border-slate-200
   bg-white p-8 shadow-sm">

<!-- Canon -->
<article data-component="card">
```

Nine classes to one attribute. And its highlighted sibling, which in Tailwind
means re-specifying the whole
box (`border-2 border-indigo-600 shadow-lg lg:-mt-4`) and in Canon is
`data-variant="featured"`.

## What does not migrate

Be honest with yourself about these rather than fighting them.

- **Arbitrary values.** `top-[117px]` has no Canon spelling and is not supposed
  to. If a value has no token, it does not exist; either it becomes a token in
  your theme or the design was arbitrary.
- **Utility-driven one-offs.** Canon has 15 components. A datepicker, a kanban
  board, a file uploader: those are yours, in `data-x-component` and
  `@layer canon.app`. That is a supported door, not a defeat.
- **Per-breakpoint layout.** Canon's layouts are responsive by construction and
  it has `data-hide="mobile|desktop"`. It does not have `sm: md: lg:` on every
  attribute, on purpose. If a page genuinely needs three distinct layouts, that
  is app-layer work.
- **JS component libraries.** Canon is CSS. If you are on headlessui or Radix,
  Canon styles the markup they render; it does not replace them.

## Doing it with an LLM

This is the case Canon was built for, and the one the author ran: an entire
trilingual portfolio moved off Tailwind by agents, keeping its exact brand
through a ~60 line theme file, net -770 lines.

Give the model [`prompts/AGENTS.md`](prompts/AGENTS.md) and one page at a time.
One page is the unit that matters: context stays small enough that the model
sees the whole thing, and each page is independently reviewable. Then verify
mechanically rather than by reading:

```bash
npx -p canoncss canon-lint src/
```

If you are on TSX, add the declarations too, and a wrong value stops compiling
instead of waiting for the linter:

```json
{ "include": ["node_modules/canoncss/types/canon.d.ts", "src"] }
```

The loop is the point. The model generates, the linter and the compiler check,
and neither of them is the model's opinion of its own work.

## Checking you are done

```bash
npx -p canoncss canon-lint src/     # zero violations
grep -rn 'class="' src/             # should be empty, or only your own classes
```

`canon-lint` also prints two numbers on every run. The rule count in
`@layer canon.app` is what Canon is missing for your product, and a large one
is a bug report worth filing rather than something to live with. The coverage
figure tells you how much of the markup it could actually read, because a value
written as a JSX expression is opaque to it, and a clean result on a React
codebase is a narrower claim than a clean result on HTML.
