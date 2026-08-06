// R1 fixture for the JSX tag scanner, and a regression test for a blind spot.
//
// The tag body used to be matched with [^<>]*, which stops at the first `>`.
// A JSX handler contains one, in the arrow: `onChange={(e) => f(e)}`. So every
// attribute written after a handler was invisible to every per-tag rule, and
// the linter reported clean on markup it had not finished reading. That is the
// worst direction for a checking tool to be wrong in.
//
// Found by running canon-lint over its own documentation site, where R10 fired
// on a <textarea> that did have an aria-label, three lines below an onChange.
//
// That sentence is the second assertion in this file. It writes <textarea> and
// <select data-component="select"> in prose, and neither may be scanned as
// markup: JS comments are blanked now, where before only HTML and JSX ones
// were. An earlier version of this fixture had to avoid angle brackets to
// stay green, which was the bug wearing a workaround.
//
// The URL below must survive that blanking, because `//` is also every https
// link ever written, and eating one would blank real markup after it:
// https://github.com/marcelodevelop/canoncss <div data-component="nope">
//
// Blanking too much is the dangerous direction. It does not add false
// positives, it removes true ones, which is the failure this file exists for.
//
// Two assertions live here, and both need the scanner to get past the arrow:
//
//   1. `data-size="enormous"` is a real R1 violation and must be caught even
//      though it sits after the handler. The old scanner missed it.
//   2. The `aria-label` on the same element must be SEEN, so R10 must not fire.
//      The old scanner missed that too, in the other direction.
//
// So this file must produce exactly one violation, and it must be R1.

export const Editor = () => (
  <div data-layout="stack" data-gap="md">
    <textarea
      data-component="textarea"
      onChange={(e) => console.log(e.target.value)}
      aria-label="Canon markup editor"
      data-size="enormous"
    />

    {/* A nested expression with more than one `>` in it, and a template
        literal containing a brace, because the scanner tracks both. */}
    <input
      data-component="input"
      aria-label="Filter"
      onKeyDown={(e) => (e.key === 'Enter' ? submit(`${e.key}`) : null)}
      data-state="error"
    />
  </div>
);

declare function submit(v: string): void;
