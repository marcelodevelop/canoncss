import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Layouts' };

export default function Layouts() {
  return (
    <div data-layout="centered" data-width="content">
      <div data-layout="stack" data-gap="xl" data-padding="2xl">
        <div data-layout="stack" data-gap="sm">
          <h1>Layouts</h1>
          <p data-tone="subtle">
            Seven patterns. Every layout takes <code>data-gap</code>,{' '}
            <code>data-align</code> and <code>data-justify</code>.
          </p>
        </div>

        <h2>stack</h2>
        <p>Vertical flow with uniform gap. The default container for everything.</p>
        <div className="demo demo-tile">
          <div data-layout="stack" data-gap="sm">
            <div>one</div>
            <div>two</div>
            <div>three</div>
          </div>
        </div>
        <pre>
          <code>{`<div data-layout="stack" data-gap="sm">…</div>`}</code>
        </pre>

        <h2>row</h2>
        <p>
          Horizontal flow. Add <code>data-wrap</code> to allow wrapping.
        </p>
        <div className="demo demo-tile">
          <div data-layout="row" data-gap="sm">
            <div>one</div>
            <div>two</div>
            <div>three</div>
          </div>
        </div>
        <pre>
          <code>{`<div data-layout="row" data-gap="sm" data-justify="between">…</div>`}</code>
        </pre>

        <h2>grid</h2>
        <p>
          <code>data-cols</code> of 1–4, or <code>auto</code> for fill-as-many-as-fit
          (min 280px). Cols 4 collapse to 2 under 1024px, cols 3 under 768px,
          everything to 1 under 480px.
        </p>
        <div className="demo demo-tile">
          <div data-layout="grid" data-cols="3" data-gap="sm">
            <div>one</div>
            <div>two</div>
            <div>three</div>
            <div>four</div>
            <div>five</div>
            <div>six</div>
          </div>
        </div>
        <pre>
          <code>{`<div data-layout="grid" data-cols="3" data-gap="lg">…</div>`}</code>
        </pre>

        <h2>sidebar</h2>
        <p>
          240px sticky sidebar + fluid main. Collapses to a single column under
          768px. Children are named by slot.
        </p>
        <pre>
          <code>{`<div data-layout="sidebar">
  <aside data-slot="sidebar">…</aside>
  <main data-slot="main">…</main>
</div>`}</code>
        </pre>

        <h2>centered</h2>
        <p>
          Centered max-width column. <code>prose</code> = 65ch, <code>content</code>{' '}
          = 768px, <code>wide</code> = 1200px (default).
        </p>
        <pre>
          <code>{`<div data-layout="centered" data-width="prose">…</div>`}</code>
        </pre>

        <h2>hero</h2>
        <p>Full-viewport centered section for landings.</p>
        <pre>
          <code>{`<section data-layout="hero">
  <div data-layout="stack" data-gap="lg" data-align="center">…</div>
</section>`}</code>
        </pre>

        <h2>split</h2>
        <p>Two equal columns; one column under 768px.</p>
        <div className="demo demo-tile">
          <div data-layout="split" data-gap="sm">
            <div>left</div>
            <div>right</div>
          </div>
        </div>
        <pre>
          <code>{`<div data-layout="split" data-gap="lg">…</div>`}</code>
        </pre>

        <h2>Modifiers</h2>
        <pre>
          <code>{`data-gap     = xs | sm | md | lg | xl | 2xl
data-align   = start | center | end | stretch
data-justify = start | center | end | between | around`}</code>
        </pre>
      </div>
    </div>
  );
}
