# Changelog

All notable changes to Canon CSS are documented here.
Format: [Keep a Changelog](https://keepachangelog.com). Versioning: [SemVer](https://semver.org).

## [Unreleased]

### Fixed
- **The prompts claimed v0.1 through five releases.** All three shipped prompt
  files opened with `CANON CSS v0.1` - stamped at 0.1.0 and never touched while
  the package moved to 0.6.0. Nothing parses that line, but the documented
  consumption model is copying the prompt into other repos, and the header is
  the only provenance marker saying which vocabulary generation a stale copy
  teaches. `check-release` guarded the header of `dist/canon.css` and never
  these. `build.sh` now stamps line 1 of both prompt sources with the full
  `vX.Y.Z` from package.json (`AGENTS.md` inherits it through its existing
  generation), and `check-release` asserts all three headers state the package
  version. The enforcement is free: CI already runs the build and
  `git diff --exit-code`, so a version bump without a rebuild now fails CI the
  same way a stale dist does.
- **R10 did not recognise React's spelling of `<label for>`.** The labelled-id
  collector matched `for=` alone, and `htmlFor` is the only spelling React
  accepts, so every correctly labelled control in a `.jsx`/`.tsx` file drew an
  R10: measured in canon-stock, 11 of 11 R10s were this false positive. The
  message made it worse - "add aria-label" on a control that already has a
  visible label is the antipattern, and auto-reach followed it into a real
  WCAG 2.5.3 divergence, a visible label reading "Repetila" beside an
  aria-label reading "Repetir contrasena". The collector now accepts both
  spellings, and the message suggests `htmlFor` in `.jsx`/`.tsx` files and
  `for` everywhere else. Known limitation: `htmlFor={expr}` paired with
  `id={expr}` is opaque to the scanner and stays flagged unless the control
  carries `aria-label` - measured across the corpus, 2 occurrences, both of
  which already do.
- **The linter judged the framework's own stylesheet as user CSS.**
  `canon-init` copies `canon.css` into the repo, so it sits inside the linted
  tree, and that polluted the one number the linter exists to report: its 76
  token definitions (54 root + 22 dark) were counted as overrides, so a
  project with **no theme at all** reported 76 of "brand surface". Every
  measured project sat on a phantom floor of 76, which made Canon's defaults
  look like something nobody shipped - and corrected, two of five real
  projects turn out to run on exactly the defaults. Removing a token also
  broke every vendored copy of the previous release retroactively, which is
  how this was caught: the two dead tokens below started failing R7 in four
  projects that had never heard of the change. A file opening with the
  `/* Canon CSS vX.Y.Z |` header build.sh writes is now skipped entirely.
- **A shipped theme was turning a knob wired to nothing.** Three tokens sat in
  `tokens.css` for five releases consumed by no rule: `--weight-normal`,
  `--leading-loose` and `--duration-slow`. That is the R7/R9 failure published
  as vocabulary: `themes/soft.css` set `--weight-normal: 450` in the reasonable
  belief that it thickened body text, the linter counted the override as brand
  surface, and the page did not change. The body now reads
  `font-weight: var(--weight-normal)` - no visual change on the default, since
  400 is what the browser used anyway, and the soft theme finally does what its
  author meant. The other two tokens are removed rather than wired: a token
  earns its line by being read, and adding one back costs a minor when
  something needs it. `check-docs` now fails on any token nothing consumes.
- **The equal-column bug lived on in the teaching materials.** 0.5.0 moved
  Canon's grid to `minmax(0, 1fr)` with a measured case, and the old
  `repeat(7, 1fr)` survived in the README, `EXTENDING.md` and
  `extensions/date-field.css` - the reference extension `canon-init` copies
  into people's repos, and the three places extensions get copied from. All
  three now match the framework, and `check-docs` greps the teaching materials
  so the corrected pattern cannot drift back.
- **The full prompt kept teaching the two tokens the release removed.** The
  dead-token fix above called the pattern "the R7/R9 failure published as
  vocabulary", and `prompts/system-prompt-full.txt` is exactly that file: it
  went on listing `--leading-loose` and `--duration-slow` in its token table,
  so the official prompt republished the same failure the release closed. A
  theme author copying from it wrote `var(--duration-slow)` and got R7 "not a
  Canon token" back from the linter shipped in the same package. The short
  prompt and `AGENTS.md` were already clean; the full prompt now reads
  `{tight|normal}` and `{fast|normal}`. `check-docs` gains the inverse of the
  dead-token guard: every brace pattern in the two prompt token tables is
  expanded and each expanded token must exist in `tokens.css`. Scoped to the
  prompts on purpose - a broad scan of the other docs produced ~8 classes of
  false positive (CLI flags, markdown table rules, glob notation, deliberate
  typo examples).

### Removed
- `--leading-loose` and `--duration-slow`. Defined since 0.1.0, read by
  nothing, so overriding them was silently a no-op. No shipped theme and no
  known project touches either.

## [0.6.0] - 2026-08-09

Both changes below are corrections, and both are the reason this is a minor
rather than a patch. The linter now rejects markup it used to accept, so a
build that was green can go red, and `input[type="file"]` restyles a control
that renders on pages already published. Neither should arrive in an
`npm update` nobody chose.

### Fixed
- **`input[type="file"]` was the one native control Canon never styled.** Two
  applications built on Canon left it bare, on the upload screen each product
  was actually about, and it rendered as an OS-grey control matching nothing
  else on the page.

  It was read as a missing component at first, a dropzone or an uploader, and
  it is not. Canon had already decided to style native controls by element
  rather than by attribute: checkbox, radio, the switch and `progress` all work
  bare, because `type="checkbox"` already declares the role and no attribute can
  make the browser hand over the control it draws. A file input is the same
  category and was simply skipped. That is also why neither author diverged and
  neither thought they were extending anything: there was nothing to reach for.

  The control now takes Canon's input chrome and `::file-selector-button` reads
  as a secondary button, with a forced-colours border so the clickable half
  stays visible. No new vocabulary, and the count stays at seventeen.
- **`data-variant` was checked against a set no component actually has.** Every
  variant selector in `components.css` is scoped -
  `[data-component="alert"][data-variant="error"]` - and the linter checked the
  value against the union of all of them. So a variant borrowed from another
  component passed and then matched nothing: valid markup, clean lint, no
  styling. The R7 and R9 failure mode, one level up and in the HTML.

  Found in a shipped app rather than by reading the source. An upload screen
  had written `<div data-component="alert" data-variant="danger">`, because
  `danger` is what a button uses. It rendered as a plain alert with no red bar,
  on the one screen where an error has to look like an error, and the author
  had run the linter.

  `data-variant` is now validated against the component it sits on. Measured
  across five projects before shipping: 1 of 22 component+variant pairs was
  dead, and no project gained a false positive. A component with no variants at
  all is reported too. `<Card data-variant="featured">` still falls back to the
  union, because JSX forwards the attribute to an element this pass never sees.

  Breaking in name only: the only markup it rejects is markup that was already
  doing nothing.
- **Canon's first words to a Next.js adopter were four violations from files
  they did not write.** `create-next-app` ships `page.module.css` and
  `globals.css`, both defining `--text-primary` and `--text-secondary`. Those
  land in Canon's `--text-*` namespace without being tokens, so R7 correctly
  reported that they override nothing and then suggested `--text-xs`, which is
  advice for the wrong problem. The file wants deleting, not renaming, and
  `globals.css` fights the reset besides. The violations still print and still
  fail - a project may legitimately keep its own `globals.css` - but the
  summary now names the file as scaffold and says so.
- **Two shipped docs had drifted off the component count.** `EXTENDING.md`
  opened on "Canon has fourteen components" and `MIGRATING.md` said 15, three
  releases after it became 17, both in the first paragraph a reader lands on.
  `check-docs.mjs` only ever read the README. It now reads every shipped doc
  and understands spelled-out numbers, which is how one of them was written.

## [0.5.0] - 2026-08-06


### Fixed
- **The burger is drawn now, not typed.** It was the only mark in the framework
  the markup had to supply: the disclosure caret is generated, the stepper's
  numbers and its tick are generated, and the mobile menu asked the author for a
  literal `U+2630`. Two things were wrong with that. A glyph stored as a
  character is one encoding pass from becoming something else, which is exactly
  how the stepper's tick once shipped as `¹3`. And a screen reader announcing
  "trigram for heaven" is not a menu button. The summary now draws three lines
  and hides whatever word the author wrote, which stays as the accessible name,
  so `<summary>Menú</summary>` renders as a burger and announces as "Menú". It
  becomes a cross when open, so the control says what it does next.
- **`data-cols` promised equal columns and did not deliver them.** The grid used
  `repeat(N, 1fr)`, and a bare `1fr` is `minmax(auto, 1fr)`, so a track will not
  shrink below its content's min-content width and one wide cell makes its
  column wider than the rest. Measured on a real four-up product grid: the card
  carrying a discount badge came out in a 238px column against 232. Six pixels
  is the harmless version; a long unbreakable word does it hard.
- **Comments in a `.css` file were linted as rules.** An app-layer file that
  documented itself drew false R9 violations for rules it did not contain, and
  worse, a brace in prose counted toward the app-layer rule total, which is the
  one figure the escape hatch exists to produce.
- **A tag written inside a JS comment was scanned as markup.** HTML comments and
  JSX `{/* */}` comments were already dropped; plain `//` and `/* */` ones were
  not, so prose describing a `<textarea>` produced an R10 for a control that
  does not exist. `//` needed care, because it is also every `https://` link
  ever written and blanking real markup would make the linter miss violations,
  which is the failure directly below. The scan tracks quotes and will not open
  a comment on a `//` that follows a colon. Strings are deliberately left alone:
  a docs page writes its examples in them, and those are markup worth checking.
- **An arrow function hid every attribute after it from the linter.** The tag
  body was matched with `[^<>]*`, which stops at the first `>`, and a JSX
  handler contains one in its arrow. Every attribute written after a handler
  was invisible to every per-tag rule, so `canon-lint` reported clean on markup
  it had not finished reading. Found by running it over its own documentation
  site, where R10 fired on a `<textarea>` that did have an `aria-label`.

## [0.4.0] - 2026-08-06


### Added
- **Two components and two things that needed none.** `alert` and `breadcrumb`
  join the vocabulary; `<progress>` and
  `<input type="checkbox" role="switch">` are styled bare. Capability rose by
  five and the closed vocabulary by three.
  - The two bare ones follow the rule checkbox and radio already set in this
    file: an element or an ARIA role that declares itself needs no attribute
    repeating it. `data-component="progress"` would be the same claim twice.
    This is R5 from the other direction, and it is how the vocabulary stays
    smaller than the set of things Canon renders.
  - `alert` is the gap `badge` could not fill. A badge is an inline span; there
    was nothing that could hold a sentence, so a trial-expiry notice or a
    form-level error went to the app layer. Its body text is `--color-content`
    rather than the status colour, because a badge is three words and can be
    tinted while a paragraph is read. It carries **no role by itself**: a
    message present at render is ordinary content, and baking in `role="alert"`
    would make every static callout interrupt a screen reader.
  - `breadcrumb` sits on `<nav>` around an `<ol>`, and most of its CSS undoes
    what the reset does to `nav a`, which is tuned for a sidebar.
  - All six forced-colours cases were handled in the same change rather than
    left for later. `appearance: none` removes the control the UA would have
    drawn and a forced palette then removes the background that replaced it, so
    an unhandled `<progress>` renders as an empty track and an unhandled switch
    as nothing at all.
  - Contrast is gated, not asserted. The four alert backgrounds, the current
    pagination link and the switch's thumb-against-track are in
    `check-contrast.mjs` and clear AA in both shipped themes and both modes.
    The tightest is the switch in its off position at 3.07:1 against a 3.0
    threshold, which is exactly the kind of margin that needs a gate rather
    than a promise.
  - These shipped by setting aside the admission test, which wants measured
    divergence and got framework parity instead. **The test was then actually
    run, and it removed one of the three.** See below.
- **`examples/docs-article/`**: an API reference page using all of them, plus the
  table, disclosure and topbar burger. Linted by `npm test` like every other
  example, and verified at 375px with nothing escaping the viewport.
- **`canon-lint --help`**, which used to fail with `ENOENT` on a file called
  `--help`. `canon-init` answered the flag and this did not, so the first thing
  a new user types came back as a filesystem error. It now prints usage and all
  eleven rules with one line each: the failure output gives a code, and nothing
  told anyone what a code meant without opening the README.
- **Framework integration docs**, which did not exist in any file. Not Next.js,
  not Astro, not Vite, not one word. Canon is a single stylesheet with no build
  step so the answer is one import line, but "obvious once you know" is what
  documentation is for. A table of which file the import goes in and where
  `data-theme` goes, per framework, plus the parts that genuinely differ from a
  utility framework: no purge step, no safelist, no dynamic-class footgun.
  - Every path verified against the real packed tarball installed into a scratch
    project, rather than asserted.
  - The cascade note was wrong on the first draft and was checked in a browser
    before it shipped. "Canon first, your theme second" implies order decides
    it; it does not, because an unlayered theme `:root` beats Canon's layered
    rules in either order, which is the property that lets 60 lines retarget the
    framework.
- **`data-component="stepper"`**: an `<ol>` of checkout or onboarding steps.
  Current step is `aria-current="step"`, the same standard-attribute pattern
  `nav` uses; completed steps are `data-state="complete"`; upcoming is neither,
  because a default should not need a name. Numbers and rails are generated, so
  the markup carries no index to fall out of order. On a narrow screen only the
  current label survives, which is what makes every hand-built version of this
  overflow.


- **R10: a form control with no accessible name.** Not a general accessibility
  linter and it does not try to be. It checks one thing, for the same reason R7
  and R9 exist: the failure is silent. A `<select>` with no label renders
  perfectly, reads correctly to anyone looking at it, and is unusable to anyone
  who is not. A name comes from a wrapping `<label>`, a `<label for>`, or
  `aria-label`/`aria-labelledby`. A placeholder is not a label.
  - Scoped to Canon markup. A file with no Canon attribute anywhere is somebody
    else's HTML, and grading the Tailwind control condition against Canon's
    rules would be the kind of rigged comparison the study exists to avoid.
  - Measured before it was written: **10 controls of 357 across the corpus had
    no accessible name**, every one in a toolbar or filter row. Two were in
    `examples/`, which are meant to be exemplary, and are fixed. The other seven
    are generated evidence and are baselined instead: `npm test` asserts exactly
    seven, and that R10 is the only rule they break.
- **`scripts/check-contrast.mjs`**: WCAG ratios for the colour pairs Canon's
  components actually render, read out of `src/components.css` rather than
  invented, across both shipped themes and both modes. It started at **17
  failing pairs and every one is now fixed**. CI holds it at zero and fails in
  both directions, so contrast cannot regress and a fix cannot land without
  lowering the number.
- **TypeScript declarations for the whole vocabulary**, in `types/canon.d.ts`,
  generated from `bin/vocab.mjs` by the same build step that writes the VS Code
  data file, so the editor, the linter and the compiler cannot disagree about
  what exists. A closed vocabulary is a union type, and every TSX codebase was
  getting none of it: React types allow any `data-*` with any value, so
  `data-layout="stak"` compiled, rendered unstyled, and waited for the linter.
  - One `tsconfig` "include" line to adopt. It augments `HTMLAttributes`, so it
    covers every element with no per-element wiring and no runtime cost, and
    every attribute is optional, so nothing that was already right breaks.
  - It closes the hole `canon-lint` reports and cannot fill: a value written as
    an expression is opaque to a text linter and is checked by the compiler.
  - `data-x-*` stays `string`, because a closed type on the namespace for things
    Canon does not have would defeat the escape hatch.
  - Asserted in both directions. `types/canon.test-d.tsx` checks the vocabulary
    compiles and that eight wrong values do not, via `@ts-expect-error`, which
    is itself an error when the line below it turns out to be fine. `npm test`
    stays dependency-free; this is `npm run test:types` and its own CI job.
- **R11: a layer in Canon's namespace that Canon does not declare.** The third
  and quietest member of the family R7 and R9 belong to, and the only one where
  the page still looks right. `@layer canon.apps { … }` renders exactly as
  intended, because a layer nothing declared sorts after every layer that was.
  What stops is the checking: R6 no longer reads that block for hardcoded
  colours, R9 no longer reads it for inert rules, R8 no longer sees the
  extensions defined in it, and the app-layer count that measures what Canon is
  missing reads zero. One character opts the file out of the entire tool.
  - Only `canon.*` is judged, so a project's own `@layer components` is its own
    business. Suggestions come from the same Levenshtein pass R7 uses.
  - The cascade order moved to `bin/vocab.mjs` and `build.sh` now emits the
    `@layer` statement from it. Two sources for one order was how R11 could
    have been wrong about what Canon declares. The built file is byte-identical.
- **Forced-colours support.** Windows High Contrast replaces every colour with
  the user's own, which is the point, and erases any distinction drawn with
  background alone, of which Canon had four. Badges (five of six variants had a
  background and no border, so they became bare text with no difference between
  success and error), buttons on `<a>` (the UA gives button chrome to `<button>`
  and not to an anchor, and R5 allows the anchor deliberately, so every call to
  action rendered as link text), the current step, and the featured card.
  Nothing else is touched: what stays legible under a forced palette is left to
  the UA, because overriding it is how a framework ends up ignoring the setting.
- **`scripts/check-css.mjs`**: the shipped stylesheet was the one artefact
  nothing parsed. `npm test` passed with exit 0 on a `dist/canon.css` containing
  `color: ;;;`, measured by building the broken file and running the suite on
  it, and a dead declaration takes the rest of its block with it. Four checks:
  the file parses (C1), every declaration has a property and a non-empty value
  (C2), every `var(--x)` resolves or carries a fallback (C3, which is R7 one
  level down and aimed at Canon's own source), and every `@layer` block sits
  inside the declared order (C4). `dist` is checked alone as well as with the
  themes, because the CDN serves it alone.
- **A packaging gate.** What npm publishes is a separate artefact from what the
  repo contains and nothing was checking it. The README promises specific
  installed paths and a missing `files` entry turns each into a silent 404;
  `types/canon.test-d.tsx`, whose whole job is to be invalid, was shipping to
  consumers. Ten paths asserted present, the fixtures asserted absent.
- **`dist/canon.css` must be pure ASCII.** Comments are stripped at build time,
  so anything non-ASCII left in it is a value the browser renders, and a
  rendered glyph written as a literal character is one encoding round-trip from
  becoming something else. It already had been (see Fixed).
- **A test for `canon-init`**, which had none, asserting the four things that
  were unstated: the CSS lands in the target, `AGENTS.md` lands at the repo
  root, nothing is written into the working directory, and a re-run overwrites
  nothing and exits 1.
- **[MIGRATING.md](MIGRATING.md)**: the working procedure for coming off
  Tailwind, measured on the two paired corpora rather than argued. Same two
  specs, five generations each under a competent Tailwind house-style prompt and
  five under Canon: **286 distinct classes and 7,151 uses against 63 distinct
  pairs and 1,038**, or 715 styling decisions per page against 104.
  - Which decides what the guide is. Not a lookup table, because most classes do
    not map to anything, they stop being written: focus rings are 608 uses and
    8.5% of the styling and all of it disappears, since the corpus turns the
    outline off and rebuilds it on the next class while Canon's reset has one
    rule. Text colour is 1,032 uses and almost none survives. So the procedure
    is ordered around deletion.
  - Every figure regenerates with `npm run census`, and `--check` asserts the
    doc still agrees, which `npm test` runs. A table of measurements nobody can
    reproduce is the drift `check-docs.mjs` already exists to prevent.

- **The admission test was run, and it took `pagination` back out.** Ten
  clean-context generations across two specs, on the vocabulary **as it stood
  before** these components existed, so the models had to build the patterns
  from what was there. Both specs described the need and never named a
  component. `test-llm/admission-docs/`, `test-llm/admission-tickets/`, and
  `scripts/admission.mjs`, which was written before the pages were read.
  - All ten reached for all three patterns. `alert` and `breadcrumb` diverged
    and stayed: 8 cards against 2 bare stacks for the notice, with the card
    family unable to agree whether severity was `data-variant="featured"`,
    `data-tone="error"` or the badge inside it; and an even 5/5 split between
    `<a>` and `<button data-variant="link">` for a crumb, which are two
    different keyboard and screen-reader contracts.
  - `pagination` **converged and was removed**. Three of five wrote
    `<nav aria-label="Pagination" data-layout="row" data-gap="sm"
    data-align="center" data-wrap>` almost to the character, with ghost for
    other pages, primary plus `aria-current="page"` for the current one, and
    secondary for prev/next. The only variation was `data-gap` sm against md,
    which is a modifier and not structure. That is the footer case again, and
    the rule caught it two commits after the component shipped. The
    construction is now stated in both prompts and the skill, which is what the
    rule prescribes and costs nothing to maintain.
  - Not acted on, but recorded: **three of five docs generations reused
    `stepper` for "page 3 of 7"**, a checkout-steps component pressed into
    service as a position indicator. The most interesting open question the run
    produced, and too small an N on a sub-pattern to move on yet.

### Fixed
- **A card ate a third of any long word it was given.** `overflow-wrap:
  break-word` was on `p` and `h1`-`h6`, the tags that hold prose rather than the
  boxes that hold text. A card body is a `<div>` and the card clips at its own
  radius with `overflow: hidden`, so a URL, an API key, an email or a hash in
  one did not wrap, did not scroll and did not warn. Measured in a browser at
  **372px of a 559px string visible**, 67%, with no scrollbar and nothing to
  suggest the text continued. Moved to `body`, where it inherits into every box
  that holds text: three lines out, one line in. `break-word` rather than
  `anywhere` deliberately, since it leaves `min-content` sizing alone and so no
  grid track or flex item changes size because of it.
- **A modal opened with `showModal()` painted its scrim twice.** The note in the
  source said the element's own background never covers the viewport in that
  case, which is true of a default `<dialog>` and false of this one, because
  Canon forces `position: fixed` with `inset: 0` precisely so it does. So both
  the `::backdrop` and the element over it painted: two layers of
  `rgb(0 0 0 / 0.32)` for an effective 0.54, and `blur(10px)` applied to the
  result of `blur(10px)`. Measured at 980x2122 in a 980x2122 viewport.
  - `:modal` is the distinction the previous version had no way to draw. It
    matches only a dialog the browser has put in the top layer, which is exactly
    the case that already has a `::backdrop`, so the element hands the scrim
    over. A `<div data-component="modal">` never matches and keeps its own, and
    neither does a declarative `<dialog open>`, which is what `examples/modal/`
    uses and which has no `::backdrop` either. A browser without `:modal` drops
    the rule and gets the previous behaviour.
- **Two generated files were outside the CI drift check, and one had drifted.**
  The check compared four paths and `bin/tokens.mjs` and `bin/defaults.mjs` were
  in neither that list nor anyone's memory. `defaults.mjs` was stale: the
  forced-colours work added a `border` rule for `[data-component="button"]`,
  which makes the button's variants disagree about `border`, so `gen-defaults`
  correctly stops treating it as a settled default. It was never regenerated and
  CI had no opinion, and the effect was quiet and real, because **R9 lost the
  ability to flag an inert `border` override on a button**, which is exactly the
  valid-CSS-that-changes-nothing R9 exists for. The check now has no path list:
  `build.sh` only writes generated artefacts, so after it runs the tree must be
  clean, and anything generated later is covered without anyone remembering.
- **Both prompts had `stepper` indented four spaces** where every other
  component sits at two, so the one block describing it read as a continuation
  of the `table` line above it, in the file the whole thesis rests on.
  `check-docs.mjs` now asserts every component and layout appears at the table's
  own indentation rather than merely appearing somewhere, which is all the
  previous check required.
- **Every completed step rendered `¹3` where the tick should be.** The stepper's
  complete state carried `content: '¹3'`, bytes `c2 b9 33`, directly under a
  comment saying a tick replaces the number once the step is done. A literal
  checkmark went in and an encoding round-trip brought it back as
  superscript-one followed by a three, and it had been shipping in
  `dist/canon.css`. Written as `content: '\2713'` now, which is the actual fix:
  the character was never the fragile part, storing it as a character was. It
  was the only non-ASCII byte in the built stylesheet, which is what made the
  gate above cheap.
- **Dark mode stopped at the edge of what Canon paints.** Canon's tokens colour
  what Canon draws; everything else is painted by the UA, and the UA reads
  `color-scheme`, not custom properties. Without it `<html data-theme="dark">`
  produced a correct dark page with light furniture: a light scrollbar, a light
  popup under every native `<select>`, a light calendar inside
  `<input type="date">`, and the browser's light autofill highlight over a dark
  input. Two lines in the tokens layer. Both shipped themes keep a light surface
  in light mode and needed no change; the blank theme `canon-init` writes now
  carries the commented override for a theme whose light mode is itself dark.
- **`canon-init` put the CSS in one repo and `AGENTS.md` in another.** The
  destination was the bare string `'AGENTS.md'`, which is the working directory:
  right by accident when that is already the repo root, and wrong the moment a
  target is named, so `canon-init ../other-project` vendored Canon into the
  other project and dropped the agent instructions wherever the command was
  typed. It genuinely does not belong beside the stylesheet, since agents read
  it from the root and the CSS usually lands in `src/styles`, so the root is now
  resolved from the target by walking up for a `.git`.
- **A duplicated block in the reset**: `nav ul, nav ol` set the same two
  declarations twice, under two comments saying the same thing in the same
  language.
- **The README's size figures were stale**, claiming 29kb raw and 5.5kb gzipped
  against an actual 29.7 and 5.4. Caught by the size gate on an unrelated edit,
  which is what it is for.
- **The select looked wrong, and it was two bugs.** Its right padding was
  `var(--space-2xl)`, the token for the gap *between page sections*: 64px on the
  default theme and **120px on soft**, which is the empty gulf you could see
  between the label and the edge. An arrow is a fixed-size mark rather than part
  of the page's spacing rhythm, so the padding is now the control's own
  horizontal padding plus a fixed allowance, and it tracks `data-size` instead
  of ignoring it: 28, 36 and 44px for `sm`, `md` and `lg`.
- **The select's caret carried a literal `#6b7280`**, a cold grey baked into a
  data URI, which is exactly what Canon's own rule 1 forbids. It could not
  follow a theme and it was nearly invisible in dark mode. A data URI cannot
  read a custom property, so the caret is now drawn with two gradients and
  follows `--color-content-subtle` like every other piece of secondary ink.
  - Worth noting: the size rules carry two attribute selectors, so they outrank
    the base rule's `padding-right` regardless of source order. The first
    version of this fix left `sm` and `lg` with the label running underneath
    the caret.
- **A theme's `:root` silently beat Canon's dark block.** Theme files are not in
  a layer and Canon's `[data-theme="dark"]` is, so any token a theme sets in
  `:root` and omits from its own dark block keeps its light value on a dark
  page. `themes/soft.css` did exactly that with all eight status tokens: four
  pale mint and cream badge backgrounds sitting on `#241c18`, label text at 2.5
  to 3.2 against a 4.5 requirement. Now 4.7 to 6.7.
- **`themes/soft.css` light was failing eleven pairs**, including its primary
  button at 2.79. The coral is a background under the inverse ink, ink on the
  page for a link, and ink on its own tint for a badge, and in this theme the
  inverse and the surface are the same cream, so all three are one contrast
  test. `#f2705a` could not pass any of them; `#b53a20` passes all three. The
  status colours moved the same way and the pale tints they sit on did not.
- **Every control boundary failed WCAG 1.4.11.** `input`, `select` and
  `textarea` sit on `--color-surface`, the same colour as the page, so the
  border is the only thing saying where the control is. It ran 1.52 to 2.41
  against the required 3.0 in all five theme and mode combinations.
  `--color-border-strong` is darker in each of them now.
- Two marginal misses in the default light theme, `--color-content-subtle` at
  4.41 and `--color-success` at 4.30, against 4.5.
- **The modal was broken on `<dialog>`, which is its canonical element.** Three
  user agent styles were never reset, and a `<div>` carries none of them, which
  is why it went unnoticed until a `<dialog>` example was rendered.
  - `dialog:not([open]) { display: none }` is a **user agent** rule and Canon's
    `display: flex` is an author rule, so the author rule won. **Every Canon
    modal on a `<dialog>` was permanently on screen, closed or not.** That is
    the serious one.
  - `width` and `height` default to `fit-content`, which beats `inset: 0`, so
    the full-screen overlay rendered as a 517x283 box in a 1280x720 viewport.
  - `border` defaults to solid, drawing a 2.4px black frame around the scrim.
  - Now covers the layout viewport exactly, with the panel centred in it, on
    both `<dialog>` and `<div>`.
- **The modal scrim blurs what is behind it** rather than only dimming it, the
  same `backdrop-filter` treatment the topbar already used. Because the blur
  separates the layers on its own, the scrim itself got lighter: 0.5 flat was a
  smear of unreadable shapes competing for attention, and it is 0.32 now.
  - `::backdrop` is styled to match, so a `<dialog>` opened with `showModal()`
    gets the same treatment as one used with the `open` attribute. `modal` sits
    on `<dialog>` or `<div>` and only one of those has a `::backdrop`.
  - `@supports not (backdrop-filter: ...)` restores a heavier scrim where blur
    is unavailable, since there the scrim is the only separation.
  - `prefers-reduced-transparency: reduce` drops the blur entirely and darkens
    the scrim instead. Blur is a transparency effect and people switch those off
    because they make text harder to read.
  - The scrim colour is a literal, and it is the only one in `components.css`.
    No token fits: a scrim must stay dark in both modes and every colour token
    inverts between them, so deriving it from `--color-content` puts fog over a
    dark page. A `--color-scrim` token would fix that and is a five-file
    vocabulary change, not taken here.
- **`examples/modal/`**: a page with enough behind the dialog to actually see
  the blur, and the three select sizes side by side. A flat scrim over a plain
  page proves nothing.
- **`scripts/check-tailwind-patterns.mjs`**: enforces rule 3 of the Tailwind
  control, the verbatim component patterns, which `check-tailwind-control.mjs`
  never covered. Written to refute a finding of this project's own, and it did.

### Measured
- The stepper **did not do what was predicted**. All five generations adopted
  it and stopped writing their own extension, which removes an app layer from
  every checkout page. But structure stayed flat at 81% and only modifiers
  moved, 67% to 72%. The double-digit structural gain `disclosure` produced did
  not repeat.
- That refines the admission test. The divergence measured was in **what an
  extension was called**, three names for one thing. Naming divergence is
  cosmetic; only structural divergence costs points.
- A convention written to settle the real divergence, whether a price is a
  `stat` and whether a form section is a `card`, **made it worse**: 78%
  structure and 65% modifiers. `card` usage went from 1-4 across generations to
  0-3, more polarised rather than less, because "a thing in a set" is a
  judgement call. Reverted. A canonical default that requires judgement is
  worse than no default.
- `data-cols` capping at 4 turned out not to be a gap. Across 108 real uses in
  the corpus nobody ever wanted 5 or 6. The only case above 4 is a 7-column
  calendar, ten times, always inside an app layer that a calendar needs anyway.
- **Finding 6, and it is the first answer to Finding 2.** Same base page, same
  change request, three clean-context agents per styling system, four requests
  across two specs. Tightening the vertical rhythm changed **5-6 of Canon's
  styling decisions against 21-29 of strict Tailwind's** on pricing, and **3-4
  against 8** on the dashboard.
- **Two of the four requests are controls and both came out level.** Adding a
  section and removing a plan are the same work either way. On the removal all
  six runs produced byte-identical decisions and every one touched exactly one
  thing outside the deleted block. There is no general editing advantage, only a
  cross-cutting one.
- **The first version of this reported a percentage, and the second spec
  killed it.** 8% against 16% inverts to 6% against 4% on the dashboard, because
  dividing by each file's own token count divides by a base that differs
  fourfold between the systems. The count and the line figure agree on both
  specs; the percentage does not. `--churn` now prints the count first and says
  so in its own output. Second time in this corpus that a second spec has caught
  a conclusion drawn from one.
- **The mechanism is that a strict prompt cannot survive its own edits, and it
  replicated.** Six runs of six across both specs: `py-12` went to zero uses and
  `p-6` from six or seven down to one, so a routine density request deleted the
  house style's verbatim patterns from the page. `check-tailwind-control.mjs`,
  which found zero violations at generation time, reports 0 of 2058 class uses
  outside the declared set on the edited files: the edit stayed inside the
  allowed utilities while dismantling the patterns built from them.
- **We then concluded that rule 3 was not mechanically enforceable, and that was
  wrong.** `check-tailwind-patterns.mjs` was written to refute it and does: about
  a hundred lines, **1 flag in 272 identified patterns** on unedited control
  files and **39** on the edited ones, naming every `Card` that lost its `p-6`.
  The structural argument failed because the density edit changed only spacing
  classes and left the identifying ones intact, so the card was still
  recognisable afterwards. Rule 3 is enforceable; it had just not been enforced.
- **What survives is one sentence wide.** Rebrand the same page, `bg-teal-700` to
  `bg-indigo-700`, which identifies the Button primary pattern rather than spaces
  it. The three buttons are still in the file, the checker's identified count
  drops 18 to 15, and it reports clean: a button it cannot recognise is
  indistinguishable from a button that is not there. An enforcement built on
  class strings goes blind exactly where an edit changes what identifies a
  component. Naming the component apart from styling it is what closes that hole,
  and it is the only part of this finding that is structural rather than a matter
  of who wrote which script.
- **Finding 7 tests that last claim properly, and it holds.** The floor above
  rested on one synthetic `sed`. Run instead with three clean-context agents per
  system on the same restyle request, "cards should be flat panels, drop the
  outline, subtle grey fill": the page still has three cards afterwards, and
  **Canon's tooling still finds 3, 3, 3 while the Tailwind checker finds 0, 0,
  1** and reports clean on all three, because a card it cannot recognise is not
  a card it can check. Its identifiable patterns fall 18 to 15.
- **All three Canon runs changed one line of markup: the `<link>`.** The restyle
  went to a stylesheet, `canon-lint` came back clean and counted `1 rule in
  @layer canon.app`. The reason is rule 2 of the control, no custom CSS, so a
  Tailwind restyle has nowhere to go but the class attributes. Both systems hit
  a floor again: all three Tailwind runs reported "round the corners more" was
  inexpressible, and Canon has no card modifier for fill or radius either.
- **Finding 7 replicated on the dashboard, and got stronger.** Canon **4, 4, 4**
  against a base of 4; Tailwind **0, 0, 0** against a base of 5, with the checker
  reporting clean on all three and its identifiable patterns falling 28 to 23.
  Twelve runs across two specs, unanimous. The only result in this sequence that
  did not shrink when it was attacked, and the spec that broke the previous two
  did not break this one.
- **An escape hatch turns a visible failure into a silent one, and that is a
  cost Canon had not measured.** Both systems have the identical radius ceiling:
  Tailwind stops at `rounded-lg`, Canon at `--radius-lg`, and `components.css`
  already gives the card exactly that. All six Tailwind runs reported that "round
  the corners more" was impossible and named the missing step. **All six Canon
  runs wrote `border-radius: var(--radius-lg)` into their app layer, which is a
  no-op, and reported the job done.** The other two thirds of the request landed
  for real. `canon-lint` counted the rule correctly as something the vocabulary
  does not cover, and has no way to notice the rule does nothing.
- **A flat card variant is rejected by the admission test.** The six escape
  hatches are nearly identical: same three declarations, same three tokens,
  varying only in layer choice. Generations that converge do not qualify, however
  real the need. Same shape as the footer in Finding 4.
- **A prompt line meant to close the accessible-name gap was tried and
  reverted, because it made the interface worse while the metric stayed flat.**
  Two lines were added telling the model to associate labels and to use
  `aria-label` for toolbar controls. Ten generations of one toolbar-heavy spec,
  five per arm:

  | | `<label for>` | `aria-label` | R10 |
  |---|---|---|---|
  | Shipped prompt | **15** | 3 | 0 |
  | With the added lines | **0** | 22 | 0 |

  Both arms are fully compliant, because the shipped prompt already gets this
  right: it produced `<label for="alert-search">Search</label>` above every
  control, which is the canonical pairing rule working. The variant read
  "a filter select in a toolbar still needs aria-label" as a licence to use
  `aria-label` everywhere and **deleted every visible label on the page**. A
  visible label is better than an invisible one for everyone.
  - So the linter earns its place and the prompt change does not. R10 catches a
    real defect class, proven by the seven it finds in older corpus files. The
    prompt needed no help, and helping it cost 15 labels.
  - Both arms are kept in `test-llm/a11y-old` and `a11y-new`, and CI asserts
    zero R10 in each, because the negative result is the finding.
- **The agents lose track too, not just the tooling.** All three Tailwind runs on
  the dashboard restyled **five** things, the fifth being a table wrapper that
  uses the Card class string verbatim. Two flagged it and asked whether it was
  meant to be a card, because nothing in the file answers that. The Canon runs
  restyled `[data-component="card"]` and hit exactly four. The identifier that
  survives the edit is the same one that scopes it.
- **Canon has a floor too, and the dashboard found it.** Eight of that page's
  fifteen gaps were already at `xs` and the base carried no `data-padding`, so
  two of three runs reported that card interiors could not be tightened without
  leaving the vocabulary. Part of the low edit count is a request declined. The
  difference is not that Canon can and Tailwind cannot; it is that Canon's runs
  stopped and said so and stayed lint-clean, and nothing registered when the
  Tailwind runs went through the floor instead.

## [0.3.0] - 2026-08-05

Reconstructed from the tag range `v0.2.1..v0.3.0`. This release was published to
npm and never written down, which is the drift `scripts/check-release.mjs` now
fails on.

### Added
- **R9: an override that overrides nothing.** A rule in `@layer canon.app` or
  `@layer canon.theme` that restates a value the component already carries is
  valid CSS, changes no pixel, and reads in review as the change having been
  made. R7 catches this at the token level; R9 is the same failure one level up.
  Only provably inert declarations are flagged: `bin/defaults.mjs`, generated
  from `src/components.css` by `scripts/gen-defaults.mjs`, drops any property
  the component's own variants disagree about.
  - It exists because six of six agents wrote one. Those six files are now the
    regression test: `npm test` fails if they stop being caught.
  - **It found one in shipped code on its first run.** `themes/institutional.css`
    restated `border: 1px solid var(--color-border)` on `card`, which the card
    already had. The theme's hairline look comes from its flattened `--shadow-*`
    tokens; that line did nothing. Removed.- **`npm run repro -- --churn <base> <edited...>`**: measures how much of a page
  an edit rewrites, in styling decisions and in lines, each normalised by the
  base file. Reproduction measures writing a page twice; this measures the other
  half of the work.
### Measured
- **The checker written to refute this project's own claim did refute it**, and
  the second spec killed the headline number a second time. Both results are in
  RESEARCH.md rather than in a drawer.

## [0.2.1] - 2026-08-04

Fixes a contradiction shipped in 0.2.0.

### Fixed
- **The extension rule contradicted the linter.** 0.2.0 told you to reuse
  Canon's modifiers on an extension, then failed you for writing
  `data-variant="unavailable"`, because `data-variant` holds Canon's closed
  value set. Measured on four clean-context generations of a page needing a
  calendar: 24 violations, 22 of them that one mistake. Extensions now have
  `data-x-variant` and `data-x-state`, which take any kebab-case value.
- **`data-x-slot` was missing from the prompt.** 0.2.0 described the namespace
  without it, so generations shattered one calendar into `calendar`,
  `calendar-grid`, `calendar-day` and `calendar-weekday` as siblings purely to
  have somewhere to hang the names. With slots in the prompt the same spec
  produced zero violations and the names converged to `calendar` and `dropzone`
  in every generation.

### Added
- **`date-field`**, the first reference extension, and `canon-init --extension`.
  A compact date picker as a zero-JS `<details>` popover. Canon has no
  datepicker and by the admission test should not have one, since generations
  converge on the shape without it. What they do not converge on is the look:
  all four produced a month-sized block sitting inline in the page, which
  reflows the form every time it opens.
- The editor autocomplete knows the `data-x-*` namespace, so an extension
  attribute is not flagged as unknown.
- `EXTENDING.md` now ships in the package. It was written for consumers and
  they could not read it.

## [0.2.0] - 2026-08-04

Two new components, four new lint rules, a second binary, the first themes
and a supported way to build what Canon does not have. The larger change is that Canon's claims are now measured rather than
argued, including the one it loses.

### Added
- **An extension namespace.** A component Canon does not have takes
  `data-x-component` and `data-x-slot`, so the closed vocabulary stays closed
  and the page is still written in one grammar instead of falling back to
  classes. R8 checks kebab-case, refuses names that shadow a real component,
  and fails an extension that nothing styles in any `@layer canon.app`, which
  would otherwise render bare with no warning. `EXTENDING.md` is the written
  guidance, including the rule no linter can check: reuse Canon's modifiers
  rather than inventing parallel ones.
- **Two starter themes**, `institutional` and `soft`, and `canon-init --theme`.
  Deliberately as far apart as two brands get, so the pair shows the range
  rather than two tastes of the same thing.
- **R7**: a theme token that overrides nothing is an error. A misspelled custom
  property is valid CSS that does nothing, so the page comes out almost right
  with no visible cause. Suggests the token you meant, by edit distance, and
  says nothing when the guess would be a bad one. `bin/tokens.mjs` generates
  from `src/tokens.css`, so a new token needs no other file.
- `canon-lint` reports the number of real token overrides it found. That figure
  is the size of the brand surface.
- **`data-component="nav"`**: a list of navigation links. The current item is
  `aria-current="page"`, not a `data-*` state, so marking it correctly also
  makes the page accessible.
- **An admission test in CONTRIBUTING.** A gap qualifies when generations
  diverge, not when they complain. It has already rejected two of four
  candidates.
- **`canon-init`**: copies `canon.css`, a `theme.css` and `AGENTS.md` into a
  project, then says the package is no longer required. Vendoring a single
  build-step-free file costs nothing, and a closed vocabulary should not also
  be a lock-in.
- **`@layer canon.app`**: the supported escape hatch for patterns the
  vocabulary does not cover. Declared and left empty. `canon-lint` reads `.css`
  now, fails on a hardcoded colour or spacing inside that layer, and counts the
  rules it finds. The count never fails a build: it measures what Canon is
  missing for that codebase.
- **`data-component="disclosure"`** on `<details>`: zero-JS expand and collapse,
  the mechanism the topbar burger already used, generalised. The caret is
  generated so the markup carries no icon to get wrong.
- Checkbox and radio inputs render correctly bare, along with a `<label>` that
  wraps its own control. Deliberately no `data-component`: `type="checkbox"`
  already declares the role.
- `canon-lint` reports its own coverage, so a clean run on a codebase full of
  JSX expression values states how much it could actually read.
- **`npm run repro`**: measures how much two or more generations of one spec
  share, reporting structure and modifiers separately, plus a
  framework-neutral `--neutral` mode for comparing against other systems.
- **Canonical defaults** in both prompts: which gap to reach for at each level,
  how to write a number with a unit, how to highlight one card, and that a
  control and its label are a stack.
- A list inside `<nav>` no longer gets bullets.
- `canon.theme` is now declared in the layer order. It worked before only
  because an undeclared layer sorts last.
- `scripts/check-docs.mjs` fails the build when the README counts or the prompt
  fall out of sync with `bin/vocab.mjs`.

### Measured
Three conditions, two specs, forty generations. Full tables in
[`test-llm/README.md`](test-llm/README.md).

- Canon reproduces **91% of its structure** across generations of one spec, on
  both a pricing page and an admin dashboard.
- Against Tailwind under an equally strict house-style prompt, Canon does
  **not** win: 88/92 against 90/90 on pricing, 93/94 against 90/91 on the
  dashboard. Strictness of the specification is what does the work.
- Against Tailwind as teams actually brief it, the gap is large: **58% to 67%**
  styling agreement against Canon's 90%, in **90 to 159 styling decisions per
  page against 41 to 43**.
- **The brand does not leak into the markup.** Two opposite brands, each with
  its own theme overriding 49 tokens of which only two matched, produced markup
  that was **96% structurally identical**. That is the one result a utility
  framework cannot reproduce.

### Fixed
- The documented lint command. `npx canon-lint` resolves by package name and
  404s; the package is `canoncss`.

## [0.1.4] - 2026-08-04
## [0.1.3] - 2026-08-04
## [0.1.2] - 2026-08-03
## [0.1.1] - 2026-08-03

Interim publishes during the 0.1.x to 0.2.0 work: R5, R7, `canon-init`, the two
starter themes, the VS Code data file, and the first Tailwind control group.
Their notes are under [0.2.0], written when the work was cut rather than split
four ways after the fact.

## [0.1.0] - 2026-08-02

Initial release.

### The framework
- Closed-vocabulary CSS framework driven by `data-*` attributes - no classes,
  no build step, zero JavaScript. ~21kb raw / ~4.2kb gzipped.
- 5 cascade layers: `canon.reset → tokens → layouts → components → utilities`.
- **Tokens**: 6 spacing steps, 7 type sizes, semantic color roles (ink & rubric
  palette - warm paper, ink primary, vermilion accent), 4 radii, 3 shadows,
  3 font stacks (sans / display serif / mono), motion tokens.
- **7 layouts**: `stack`, `row`, `grid`, `sidebar`, `centered`, `hero`, `split`
  with shared `data-gap` / `data-align` / `data-justify` modifiers and
  automatic responsive collapse.
- **12 components**: `button`, `card` (with `media|header|body|footer` slots
  and a `featured` variant), `badge`, `input`, `textarea`, `select`, `topbar`,
  `modal`, `avatar`, `stat`, `table`, `divider`.
- Prose primitives styled bare: lists, blockquote (rubric border), pre/code.
- Components are LLM-proof: card/modal headers normalize any heading tag;
  badges never stretch; nested brand anchors inherit.
- Dark mode is explicit only: `data-theme="dark"` on `<html>`. Light is the
  default; there is no automatic `prefers-color-scheme` switching.

### The LLM layer
- `prompts/system-prompt.txt` (~750 tokens) and `system-prompt-full.txt`
  (with canonical patterns + anti-patterns).
- `prompts/AGENTS.md` - drop-in for Cursor/Copilot/Codex, auto-generated from
  the system prompt by the build.
- Claude Code plugin: `/plugin marketplace add marcelodevelop/canoncss`.
- `canon-lint` - zero-dependency validator for the four rules (closed
  vocabulary, no inline styles, no style blocks, layout XOR component).

### Validation
- 3 training iterations against clean-context LLMs (structural gaps found:
  5 → 2 cosmetic → 0).
- Regression corpus: 20 LLM-generated pages including a complete 7-page
  product (marketing + auth + dark-mode app) generated by 7 blind agents -
  every page lint-clean, one coherent visual identity.

### Site
- Next.js docs site in `site/` (Vercel root directory: `site`): docs,
  live playground, and an honest Tailwind/vanilla/Canon comparison.
