---
name: canon-css
description: Write UI markup with Canon CSS, the closed-vocabulary framework. Use whenever the user asks to build, edit, or review UI in a project that uses Canon (canon.css linked, data-layout/data-component attributes present), or explicitly mentions Canon CSS. Covers HTML pages, JSX/React components, and reviewing markup for rule violations.
---

# Canon CSS

Canon is a pure-CSS framework with a closed vocabulary. There is exactly one
correct way to express each pattern. Your job: generate markup using ONLY the
vocabulary below - in HTML or JSX (the `data-*` attributes are identical in both).

## Setup (if the project doesn't have Canon yet)

One of:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/marcelodevelop/canonframework@main/dist/canon.css">
```

or copy `dist/canon.css` from https://github.com/marcelodevelop/canonframework
into the project and link/import it (`import './canon.css'` in a Next.js root layout).

## Vocabulary

TOKENS (CSS custom properties - never hardcode a value):

    --space-{xs|sm|md|lg|xl|2xl}
    --text-{xs|sm|md|lg|xl|2xl|3xl}
    --color-{brand|accent|surface|surface-raised|surface-sunken|content|
      content-subtle|content-inverse|border|border-strong|success|warning|
      error|info}  (+ -subtle variants on brand/accent/status colors)
    --radius-{sm|md|lg|full}  --shadow-{sm|md|lg}  --weight-{normal|medium|bold}
    --font-{sans|display|mono}

LAYOUTS - `data-layout` on containers:

    stack     vertical flex
    row       horizontal flex      + data-wrap
    grid      css grid             + data-cols={1|2|3|4|auto}
    sidebar   two-col              > data-slot={sidebar|main}
    centered  centered max-width   + data-width={prose|content|wide}
    hero      full-viewport section
    split     two equal columns

    Any layout also takes:
      data-gap={xs|sm|md|lg|xl|2xl}
      data-align={start|center|end|stretch}
      data-justify={start|center|end|between|around}

COMPONENTS - `data-component` on semantic elements:

    button    + data-variant={primary|secondary|ghost|danger|link}
              + data-size={sm|md|lg}
    card      > data-slot={media|header|body|footer}  (media = full-bleed top
              image). + data-variant={featured} to highlight one card in a
              group. Header text is auto-styled - no heading tags needed.
    stat      the big number of a metric (<span data-component="stat">4.8M</span>)
    table     on a <table> element; plain thead/tbody/th/td inside
    badge     + data-variant={neutral|brand|success|warning|error|info}
    input     + data-size={sm|md|lg} + data-state={error|success}
    textarea  + data-size={sm|md|lg} + data-state={error|success}
    select    + data-size={sm|md|lg}
    topbar    > data-slot={brand|nav|actions}
    modal     > data-slot=panel > data-slot={header|body|footer}
    avatar    + data-size={sm|md|lg}. A <span> with initials, or an <img> inside
              the span - never data-component on the <img> itself.
    divider   + data-variant={strong}

UTILITIES - complete list; nothing else exists:

    data-padding={xs|sm|md|lg|xl|2xl}  data-tone={subtle|brand|accent|success|error}
    data-mono  data-full  data-truncate  data-hide={mobile|desktop}
    data-motion={rise|float|pulse|lift}  (entrance | idle drift | attention |
      hover elevation; all auto-respect prefers-reduced-motion)
    class="sr-only"

## Prose - styled automatically, no attributes needed

ul/ol/li, blockquote, pre/code all render correctly bare. Sidebar/section
labels are `<p data-tone="subtle">`, never a heading element.

## Rules - enforce strictly

1. Only defined tokens. Never hardcode colors, sizes, spacing.
2. No inline styles, no `<style>` blocks, no extra CSS.
3. An element gets `data-layout` OR `data-component`, never both.
4. `data-slot` only as a direct child of its parent layout/component.
5. h1–h6 are already sized by the type scale. Do not restyle them.
6. Dark mode: `data-theme="dark"` on `<html>`.
7. Theming: adapt Canon to the brand, never bend the markup. Write a theme
   file that overrides ANY token on `:root` (colors, fonts, type scale,
   radii, shadows) plus a small `@layer canon.theme` block for the few brand
   details tokens cannot express. This is how you port an existing site to
   Canon while keeping its exact look.
8. Canon ships zero JavaScript. Interactivity is the consumer's job.

## Canonical patterns

App shell:

    <header data-component="topbar">
      <a data-slot="brand" href="/">Logo</a>
      <nav data-slot="nav">…</nav>
      <div data-slot="actions">…</div>
    </header>
    <div data-layout="sidebar">
      <aside data-slot="sidebar">…</aside>
      <main data-slot="main">
        <div data-layout="stack" data-gap="xl" data-padding="xl">…</div>
      </main>
    </div>

Card grid:

    <div data-layout="grid" data-cols="3" data-gap="lg">
      <article data-component="card">
        <div data-slot="header">Title</div>
        <div data-slot="body">Content</div>
        <div data-slot="footer">
          <button data-component="button">Action</button>
        </div>
      </article>
    </div>

Form:

    <form data-layout="stack" data-gap="md">
      <label for="name">Name</label>
      <input data-component="input" id="name" type="text">
      <div data-layout="row" data-gap="sm" data-justify="end">
        <button data-component="button" data-variant="ghost" type="reset">Cancel</button>
        <button data-component="button" data-variant="primary" type="submit">Submit</button>
      </div>
    </form>

## Anti-patterns (never do these)

    WRONG: <div style="display:flex; gap:16px">     RIGHT: <div data-layout="row" data-gap="md">
    WRONG: <div data-layout="stack" data-component="card">   → pick ONE
    WRONG: <h1 style="font-size:3rem">              RIGHT: <h1>
    WRONG: data-gap="20px"                          RIGHT: data-gap="lg"
    WRONG: <span style="color:#71717a">             RIGHT: <span data-tone="subtle">
    WRONG: <img data-component="avatar">            RIGHT: <span data-component="avatar"><img …></span>

## When reviewing existing markup

Flag every violation of the 8 rules with the exact line and the canonical
replacement. Inline styles and invented token values are always violations -
there are no exceptions.
