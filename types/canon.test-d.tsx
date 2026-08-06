// Type test for types/canon.d.ts. Run by `npm run test:types`, which is the
// only part of this repo that needs a dependency, so it is not part of the
// zero-dep `npm test`.
//
// A generated .d.ts that has never been compiled is a liability: a syntax
// error in it breaks the build of every consumer who imports it, and nothing
// else in this repo would notice.
//
// Both halves are asserted. The accept cases must compile, and the reject
// cases must not, which is checked with @ts-expect-error - a directive that is
// itself an error when the line below it turns out to be fine. So this file
// fails if the vocabulary stops being enforced just as loudly as if it stops
// being usable.

import './canon';

export const accepted = (
  <div data-layout="grid" data-cols="3" data-gap="lg">
    <article data-component="card" data-padding="md">
      <div data-slot="header">Title</div>
      <div data-slot="body" data-tone="subtle">
        Content
      </div>
      <div data-slot="footer">
        <button data-component="button" data-variant="primary" data-size="lg">
          Action
        </button>
      </div>
    </article>
    <div data-x-component="datepicker" data-x-variant="compact" data-gap="sm">
      <div data-x-slot="grid" />
    </div>
    <p data-mono data-truncate>
      mono
    </p>
    <div data-component="alert" data-variant="warning">
      <h2>Heads up</h2>
    </div>
    <nav data-component="breadcrumb">
      <ol>
        <li>
          <a href="/" aria-current="page">
            Home
          </a>
        </li>
      </ol>
    </nav>
    <nav data-component="pagination">
      <ol>
        <li>
          <a href="/2">2</a>
        </li>
      </ol>
    </nav>
    {/* Neither of these takes a data-component: the element and the role are
        already the declaration, so there is nothing for the vocabulary to add. */}
    <progress value={412} max={600} />
    <input type="checkbox" role="switch" defaultChecked />
  </div>
);

export const rejected = (
  <div>
    {/* @ts-expect-error 'stak' is not a layout */}
    <div data-layout="stak" />
    {/* @ts-expect-error 'flex' is not a layout: Canon has no such primitive */}
    <div data-layout="flex" />
    {/* @ts-expect-error 5 columns do not exist, the scale stops at 4 */}
    <div data-layout="grid" data-cols="5" />
    {/* @ts-expect-error 'huge' is not on the space scale */}
    <div data-layout="stack" data-gap="huge" />
    {/* @ts-expect-error 'xl' is not a component size, that scale is sm|md|lg */}
    <button data-component="button" data-size="xl" />
    {/* @ts-expect-error 'tabs' is not a component and this is the whole point */}
    <div data-component="tabs" />
    {/* @ts-expect-error 'progress' is styled bare, so it never became a component */}
    <progress data-component="progress" />
    {/* @ts-expect-error nor did 'switch': role="switch" is the whole contract */}
    <input type="checkbox" data-component="switch" />
    {/* @ts-expect-error 'aside' is not a slot */}
    <div data-slot="aside" />
    {/* @ts-expect-error data-theme takes dark or light, nothing else */}
    <div data-theme="midnight" />
  </div>
);

// An unconstrained string cannot satisfy a closed vocabulary. This is the case
// canon-lint has to report as opaque, because it cannot read an expression -
// here it is a compile error instead, which is strictly better.
declare const loose: string;
export const opaque = (
  <>
    {/* @ts-expect-error a string is wider than the union */}
    <div data-layout={loose} />
    {/* A narrowed one is fine, which is how you are meant to pass a variable. */}
    <div data-layout={loose as 'stack' | 'row'} />
  </>
);
