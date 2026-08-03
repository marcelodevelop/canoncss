'use client';

import { useState } from 'react';

const SAMPLE = `<div data-layout="centered" data-width="content">
  <div data-layout="stack" data-gap="lg" data-padding="xl">
    <h1>Hello, Canon</h1>
    <p data-tone="subtle">Paste your own markup here - this preview updates live.</p>

    <div data-layout="grid" data-cols="2" data-gap="lg">
      <article data-component="card">
        <div data-slot="header">A card</div>
        <div data-slot="body">With header, body and footer slots.</div>
        <div data-slot="footer">
          <button data-component="button" data-size="sm">Action</button>
        </div>
      </article>
      <article data-component="card">
        <div data-slot="header">Status</div>
        <div data-slot="body">
          <div data-layout="row" data-gap="sm" data-wrap>
            <span data-component="badge" data-variant="success">Active</span>
            <span data-component="badge" data-variant="warning">Pending</span>
            <span data-component="badge" data-variant="brand">v0.1</span>
          </div>
        </div>
      </article>
    </div>

    <form data-layout="stack" data-gap="md">
      <label for="email">Email</label>
      <input data-component="input" id="email" type="email" placeholder="you@example.com">
      <div data-layout="row" data-gap="sm" data-justify="end">
        <button data-component="button" data-variant="ghost" type="reset">Clear</button>
        <button data-component="button" type="submit">Subscribe</button>
      </div>
    </form>
  </div>
</div>`;

export function Playground({ css }: { css: string }) {
  const [markup, setMarkup] = useState(SAMPLE);
  const [dark, setDark] = useState(false);

  const doc = `<!DOCTYPE html><html lang="en"${dark ? ' data-theme="dark"' : ''}><head><meta charset="utf-8"><style>${css}</style></head><body>${markup}</body></html>`;

  return (
    <div data-layout="stack" data-gap="md">
      <div data-layout="row" data-gap="sm" data-justify="between" data-align="center" data-wrap>
        <p data-tone="subtle">Your markup</p>
        <div data-layout="row" data-gap="sm">
          <button
            data-component="button"
            data-variant="secondary"
            data-size="sm"
            onClick={() => setDark(!dark)}
          >
            {dark ? 'Light preview' : 'Dark preview'}
          </button>
          <button
            data-component="button"
            data-variant="ghost"
            data-size="sm"
            onClick={() => setMarkup(SAMPLE)}
          >
            Reset
          </button>
        </div>
      </div>

      <div data-layout="split" data-gap="lg" data-align="stretch">
        <textarea
          data-component="textarea"
          className="playground-editor"
          value={markup}
          onChange={(e) => setMarkup(e.target.value)}
          spellCheck={false}
          aria-label="Canon markup editor"
        />
        {/* sandbox sin allow-scripts: el preview solo renderiza, nunca ejecuta */}
        <iframe
          className="playground-preview"
          title="Canon preview"
          sandbox=""
          srcDoc={doc}
        />
      </div>
    </div>
  );
}
