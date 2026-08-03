import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Compare' };

const TAILWIND = `<div class="max-w-sm rounded-xl border border-gray-200
     bg-gray-50 shadow-sm overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-200 font-medium">
    Pro plan
  </div>
  <div class="p-6">
    <p class="text-gray-500">Everything in Free, plus…</p>
  </div>
  <div class="px-6 py-4 border-t border-gray-200 bg-gray-100
       flex items-center gap-2">
    <button class="inline-flex items-center justify-center
        rounded-lg bg-gray-900 px-4 py-2 font-medium text-white
        hover:bg-gray-800 transition-colors">
      Upgrade
    </button>
  </div>
</div>`;

const VANILLA = `<!-- HTML -->
<article class="card">
  <div class="card-header">Pro plan</div>
  <div class="card-body">
    <p class="muted">Everything in Free, plus…</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Upgrade</button>
  </div>
</article>

/* CSS - written, named and maintained by you */
.card { border: 1px solid #e5e7eb; border-radius: 12px;
        background: #f9fafb; box-shadow: 0 1px 2px rgb(0 0 0 / .05);
        overflow: hidden; }
.card-header { padding: 16px 24px; border-bottom: 1px solid #e5e7eb;
               font-weight: 500; }
.card-body { padding: 24px; }
.card-footer { padding: 16px 24px; border-top: 1px solid #e5e7eb;
               background: #f3f4f6; display: flex; gap: 8px; }
.muted { color: #6b7280; }
.btn { /* …and 15 more lines for states */ }`;

const CANON = `<article data-component="card">
  <div data-slot="header">Pro plan</div>
  <div data-slot="body">
    <p data-tone="subtle">Everything in Free, plus…</p>
  </div>
  <div data-slot="footer">
    <button data-component="button">Upgrade</button>
  </div>
</article>`;

export default function Compare() {
  return (
    <div data-layout="centered" data-width="content">
      <div data-layout="stack" data-gap="xl" data-padding="2xl">
        <div data-layout="stack" data-gap="sm">
          <h1>The same card, three ways</h1>
          <p data-tone="subtle">
            Not a takedown - Tailwind is excellent for humans who want control.
            This is about what happens when a <em>model</em> writes your UI.
          </p>
        </div>

        <div data-layout="row" data-gap="sm" data-align="center">
          <h2>Tailwind v4</h2>
          <span data-component="badge">~620 chars</span>
        </div>
        <pre>
          <code>{TAILWIND}</code>
        </pre>
        <p data-tone="subtle">
          Every value is a decision: gray-50 or gray-100? rounded-lg or xl? px-6 or
          p-6? Each is valid - so each generation chooses differently.
        </p>

        <div data-layout="row" data-gap="sm" data-align="center">
          <h2>Vanilla CSS</h2>
          <span data-component="badge">~830 chars + naming things</span>
        </div>
        <pre>
          <code>{VANILLA}</code>
        </pre>
        <p data-tone="subtle">
          Total control, total responsibility: you invent the class names, write
          every state, and keep it consistent across the codebase yourself.
        </p>

        <div data-layout="row" data-gap="sm" data-align="center">
          <h2>Canon</h2>
          <span data-component="badge" data-variant="brand">~280 chars</span>
        </div>
        <pre>
          <code>{CANON}</code>
        </pre>
        <p data-tone="subtle">
          One canonical form. Ask five times, get the same markup five times - and{' '}
          <code>canon-lint</code> proves it mechanically.
        </p>

        <h2>Side by side</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Tailwind v4</th>
              <th>Vanilla CSS</th>
              <th>Canon</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Valid ways to write this card</td>
              <td>Hundreds</td>
              <td>Unlimited</td>
              <td>One</td>
            </tr>
            <tr>
              <td>Same output across LLM generations</td>
              <td>Varies per run</td>
              <td>Varies per run</td>
              <td>Consistent</td>
            </tr>
            <tr>
              <td>Mechanical validation</td>
              <td>-</td>
              <td>-</td>
              <td>
                <code>npx canon-lint</code>
              </td>
            </tr>
            <tr>
              <td>Build step</td>
              <td>Yes</td>
              <td>No</td>
              <td>No</td>
            </tr>
            <tr>
              <td>CSS shipped</td>
              <td>~10kb (purged, varies)</td>
              <td>Grows with the project</td>
              <td>3.8kb gzip, fixed</td>
            </tr>
            <tr>
              <td>Prompt cost to teach an LLM</td>
              <td>Trained-in, but unconstrained</td>
              <td>N/A</td>
              <td>~600 tokens</td>
            </tr>
            <tr>
              <td>Design freedom</td>
              <td>Very high</td>
              <td>Total</td>
              <td>Deliberately low</td>
            </tr>
          </tbody>
        </table>

        <h2>When to use what - honestly</h2>
        <div data-layout="grid" data-cols="3" data-gap="lg">
          <article data-component="card">
            <div data-slot="header">Use Tailwind when…</div>
            <div data-slot="body">
              A designer or design-minded dev is crafting a distinctive, branded
              product by hand and wants pixel-level control.
            </div>
          </article>
          <article data-component="card">
            <div data-slot="header">Use vanilla CSS when…</div>
            <div data-slot="body">
              You need something no framework expresses - bespoke art direction,
              unusual layouts, heavy animation.
            </div>
          </article>
          <article data-component="card">
            <div data-slot="header">Use Canon when…</div>
            <div data-slot="body">
              An LLM writes most of your UI and you want every page it produces to
              look like one coherent product - dashboards, internal tools, MVPs,
              agent-generated apps.
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
