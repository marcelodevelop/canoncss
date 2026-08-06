# Canon CSS - agent instructions

> Drop this file into your repo root (or append it to AGENTS.md / CLAUDE.md /
> .cursor/rules). Any coding agent will then generate valid Canon markup.

```
CANON CSS v0.1 - write HTML using only this vocabulary.

TOKENS (CSS custom properties - never hardcode a value):
  --space-{xs|sm|md|lg|xl|2xl}
  --text-{xs|sm|md|lg|xl|2xl|3xl}
  --color-{brand|accent|surface|surface-raised|surface-sunken|content|
    content-subtle|content-inverse|border|border-strong|success|warning|
    error|info}  (+ -subtle variants on brand/accent/status colors)
  --width-{prose|content|wide}
  --radius-{sm|md|lg|full}  --shadow-{sm|md|lg}  --weight-{normal|medium|bold}
  --font-{sans|display|mono}

LAYOUTS - data-layout on containers:
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

COMPONENTS - data-component on semantic elements:
  button    + data-variant={primary|secondary|ghost|danger|link}
            + data-size={sm|md|lg}
  card      > data-slot={media|header|body|footer}  (media = full-bleed top img)
            + data-variant={featured} to highlight one card in a group
            Header text is auto-styled - plain text, no heading tags needed.
  badge     + data-variant={neutral|brand|success|warning|error|info}
  input     + data-size={sm|md|lg} + data-state={error|success}
  textarea  + data-size={sm|md|lg} + data-state={error|success}
  select    + data-size={sm|md|lg}
  topbar    > data-slot={brand|nav|actions|menu}. menu = mobile burger,
            zero-JS: <details data-slot="menu"><summary>☰</summary>
            <nav>links</nav></details>; auto-hides on desktop and
            replaces the inline nav on mobile.
  modal     > data-slot=panel > data-slot={header|body|footer}
  avatar    + data-size={sm|md|lg}. A <span> with initials, or an <img> inside
            the span - never data-component on the <img> itself.
  stat      the big number of a metric (<span data-component="stat">4.8M</span>)
  table     on a <table> element; style-free thead/tbody/th/td inside
  stepper   an <ol> of checkout/onboarding steps. Current one is
            aria-current="step"; done ones are data-state="complete";
            upcoming is neither. Numbers and rails are generated.
  nav       a list of navigation links, usually in a sidebar. Mark the
            current one with aria-current="page", never a data-* value.
            The topbar's own nav slot honours aria-current too.
  disclosure on <details>, zero-JS expand/collapse. First child is the
            <summary>; the caret is generated. Use for FAQ and any
            show-more section.
  divider   + data-variant={strong}
  alert     a block-level message. + data-variant={success|warning|error}
            (info is the default). Carries no role by itself: add
            role="status" if it appears in response to something the user
            did, role="alert" only if it must interrupt.
  breadcrumb on <nav> wrapping an <ol> of ancestors. Separators are
            generated; mark the last one aria-current="page".
  pagination on <nav> wrapping an <ol> of page links. Current is
            aria-current="page"; a dead prev/next is aria-disabled="true".

UTILITIES - complete list; nothing else exists:
  data-padding={xs|sm|md|lg|xl|2xl}  data-tone={subtle|brand|accent|success|error}
  data-mono  data-full  data-truncate  data-hide={mobile|desktop}
  data-motion={rise|float|pulse|lift}  (entrance | idle drift | attention |
    hover elevation; all auto-respect prefers-reduced-motion)
  class="sr-only"

PROSE - styled automatically, no attributes needed:
  checkbox and radio inputs render bare - never give them data-component,
  and a <label> wrapping its own control lays itself out.
  <progress value="60" max="100"> renders bare: the element is already the
  role. A switch is <input type="checkbox" role="switch">, also bare, because
  the role is the contract - there is no switch component.
  ul/ol/li, blockquote, pre/code all render correctly bare. Sidebar/section
  labels are <p data-tone="subtle">, never a heading element.

CANONICAL DEFAULTS - use these unless something forces another choice:
  Spacing: page sections data-gap="xl"; card bodies and field groups
    data-gap="md"; buttons sitting side by side data-gap="sm".
  A number with a unit: <span data-component="stat">$79</span> then
    <span data-tone="subtle">/month</span>. There is no price component.
  A control and its label, or a number and its caption, are a stack with
    data-gap="xs". Never leave the two as bare siblings.
  Highlighting one card in a group: data-variant="featured" on the card
    plus a badge as the first child of its header slot.

RULES - enforce strictly:
  1. Only defined tokens. Never hardcode colors, sizes, spacing.
  2. No inline styles, no <style> blocks, no extra CSS.
  3. An element gets data-layout OR data-component, never both.
  4. data-slot only as a direct child of its parent layout/component.
  5. h1-h6 are already sized by the type scale. Do not restyle them.
  6. Dark mode: data-theme="dark" on <html>.
  7. Theming: adapt Canon to the brand, never bend the markup. A theme file
     may override ANY token on :root (colors, fonts, type scale, radii,
     shadows) and may add a small `@layer canon.theme` block for the few
     brand details tokens cannot express. Markup stays pure vocabulary.
  8. Canon ships zero JavaScript. Interactivity is the consumer's job.
  9. Component roles sit on their canonical element: button=<button> or <a>,
     badge/avatar/stat=<span>, topbar=<header>, divider=<hr>, modal=<dialog>,
     card=<article>/<div>/<a>. Form controls and table use their own tag.
  10. If a pattern has no vocabulary, it goes in @layer canon.app in the
      consumer's own CSS, built only from tokens. Never inline styles,
      never a <style> block, never a hardcoded colour or spacing value.
      canon-lint counts those rules: the number is what Canon is missing.
  11. A component Canon does not have takes data-x-component, kebab-case,
      styled in @layer canon.app from tokens. Its regions are data-x-slot.
      Reuse Canon modifiers when Canon has the value you need
      (data-gap, data-padding, data-size). When it does not, because a
      calendar day is "unavailable" and no closed set predicted that, use
      data-x-variant and data-x-state, which take any kebab-case value.
      Never data-component or data-slot for something not listed above.
```
