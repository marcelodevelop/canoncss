import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Components' };

export default function Components() {
  return (
    <div data-layout="centered" data-width="content">
      <div data-layout="stack" data-gap="xl" data-padding="2xl">
        <div data-layout="stack" data-gap="sm">
          <h1>Components</h1>
          <p data-tone="subtle">
            Ten components. Selector is always <code>data-component</code>; modifiers
            are extra attributes; named children are <code>data-slot</code>.
          </p>
        </div>

        <h2>button</h2>
        <div className="demo">
          <div data-layout="row" data-gap="sm" data-align="center" data-wrap>
            <button data-component="button">Primary</button>
            <button data-component="button" data-variant="secondary">
              Secondary
            </button>
            <button data-component="button" data-variant="ghost">
              Ghost
            </button>
            <button data-component="button" data-variant="danger">
              Danger
            </button>
            <button data-component="button" data-variant="link">
              Link
            </button>
            <button data-component="button" disabled>
              Disabled
            </button>
          </div>
        </div>
        <div className="demo">
          <div data-layout="row" data-gap="sm" data-align="center">
            <button data-component="button" data-size="sm">
              Small
            </button>
            <button data-component="button">Medium</button>
            <button data-component="button" data-size="lg">
              Large
            </button>
          </div>
        </div>
        <pre>
          <code>{`<button data-component="button" data-variant="secondary" data-size="sm">
  Label
</button>`}</code>
        </pre>

        <h2>card</h2>
        <div className="demo">
          <div data-layout="split" data-gap="lg">
            <article data-component="card">
              <div data-slot="header">With slots</div>
              <div data-slot="body">Header, body and footer are all optional.</div>
              <div data-slot="footer">
                <button data-component="button" data-size="sm">
                  Action
                </button>
              </div>
            </article>
            <article data-component="card">
              No slots at all — the card pads itself.
            </article>
          </div>
        </div>
        <pre>
          <code>{`<article data-component="card">
  <div data-slot="header">Title</div>
  <div data-slot="body">Content</div>
  <div data-slot="footer">…</div>
</article>`}</code>
        </pre>

        <h2>badge</h2>
        <div className="demo">
          <div data-layout="row" data-gap="sm" data-wrap>
            <span data-component="badge">Neutral</span>
            <span data-component="badge" data-variant="brand">
              Brand
            </span>
            <span data-component="badge" data-variant="success">
              Success
            </span>
            <span data-component="badge" data-variant="warning">
              Warning
            </span>
            <span data-component="badge" data-variant="error">
              Error
            </span>
            <span data-component="badge" data-variant="info">
              Info
            </span>
          </div>
        </div>
        <pre>
          <code>{`<span data-component="badge" data-variant="success">Active</span>`}</code>
        </pre>

        <h2>input / textarea / select</h2>
        <div className="demo">
          <div data-layout="stack" data-gap="md">
            <input data-component="input" type="text" placeholder="Default input" />
            <input
              data-component="input"
              type="text"
              data-state="error"
              defaultValue="Invalid value"
            />
            <input
              data-component="input"
              type="text"
              data-state="success"
              defaultValue="Looks good"
            />
            <textarea data-component="textarea" placeholder="Textarea" />
            <select data-component="select" defaultValue="Select an option">
              <option>Select an option</option>
              <option>Two</option>
            </select>
          </div>
        </div>
        <pre>
          <code>{`<input data-component="input" type="email" data-state="error">
<textarea data-component="textarea" rows="4"></textarea>
<select data-component="select">…</select>`}</code>
        </pre>

        <h2>topbar</h2>
        <p>
          The sticky header at the top of this page. Slots: <code>brand</code>,{' '}
          <code>nav</code>, <code>actions</code>.
        </p>
        <pre>
          <code>{`<header data-component="topbar">
  <a data-slot="brand" href="/">Logo</a>
  <nav data-slot="nav">…</nav>
  <div data-slot="actions">…</div>
</header>`}</code>
        </pre>

        <h2>modal</h2>
        <p>
          Pure markup — Canon ships no JavaScript, so showing and hiding it is yours.
        </p>
        <pre>
          <code>{`<div data-component="modal" role="dialog" aria-modal="true">
  <div data-slot="panel">
    <div data-slot="header">Title</div>
    <div data-slot="body">…</div>
    <div data-slot="footer">…</div>
  </div>
</div>`}</code>
        </pre>

        <h2>avatar</h2>
        <div className="demo">
          <div data-layout="row" data-gap="sm" data-align="center">
            <span data-component="avatar" data-size="sm">
              SM
            </span>
            <span data-component="avatar">MD</span>
            <span data-component="avatar" data-size="lg">
              LG
            </span>
          </div>
        </div>
        <pre>
          <code>{`<span data-component="avatar">MA</span>
<span data-component="avatar"><img src="…" alt=""></span>`}</code>
        </pre>

        <h2>divider</h2>
        <div className="demo">
          <div data-layout="stack" data-gap="md">
            <hr data-component="divider" />
            <hr data-component="divider" data-variant="strong" />
          </div>
        </div>
        <pre>
          <code>{`<hr data-component="divider">
<hr data-component="divider" data-variant="strong">`}</code>
        </pre>
      </div>
    </div>
  );
}
