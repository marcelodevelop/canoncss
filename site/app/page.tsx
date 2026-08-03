export default function Home() {
  return (
    <>
      <section data-layout="hero">
        <div data-layout="stack" data-gap="lg" data-align="center">
          <span data-component="badge" data-variant="brand">
            Open source · v0.1
          </span>
          <h1>
            One right way
            <br />
            to do each thing.
          </h1>
          <p data-tone="subtle">
            Canon is a pure-CSS framework with a closed vocabulary,
            <br />
            designed so humans and LLMs produce the same markup.
          </p>
          <div data-layout="row" data-gap="sm">
            <a data-component="button" data-size="lg" href="/llm">
              Get the prompt
            </a>
            <a
              data-component="button"
              data-variant="secondary"
              data-size="lg"
              href="https://github.com/marcelodevelop/canonframework"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <div data-layout="centered" data-width="content">
        <div data-layout="stack" data-gap="xl" data-padding="2xl">
          <h2>Try it in 60 seconds</h2>
          <div data-layout="grid" data-cols="3" data-gap="lg">
            <article data-component="card">
              <div data-slot="header">1 · Copy the prompt</div>
              <div data-slot="body">
                Grab the ~600-token system prompt from{' '}
                <a href="/llm">For LLMs</a> with one click.
              </div>
            </article>
            <article data-component="card">
              <div data-slot="header">2 · Ask your LLM</div>
              <div data-slot="body">
                Paste it into Claude, Cursor or ChatGPT and ask for any page or
                component.
              </div>
            </article>
            <article data-component="card">
              <div data-slot="header">3 · See it live</div>
              <div data-slot="body">
                Paste the result into the <a href="/playground">Playground</a> -
                rendered instantly, light or dark.
              </div>
            </article>
          </div>

          <h2>Install</h2>
          <pre>
            <code>{`<link rel="stylesheet" href="canon.css">`}</code>
          </pre>
          <p>
            That&apos;s the whole install - <strong>19kb raw, 3.8kb gzipped</strong>,
            zero JavaScript, zero build step. In Next.js it&apos;s one import in your
            root layout:
          </p>
          <pre>
            <code>{`import 'canoncss'`}</code>
          </pre>

          <h2>Write intent, not implementation</h2>
          <pre>
            <code>{`<div data-layout="grid" data-cols="3" data-gap="lg">
  <article data-component="card">
    <div data-slot="header">Title</div>
    <div data-slot="body">Content</div>
  </article>
</div>`}</code>
          </pre>
          <p>
            Elements declare what they <em>are</em> via <code>data-layout</code> and{' '}
            <code>data-component</code>. There are no utility classes to compose and
            no alternatives to choose between. The attributes work identically in
            HTML and JSX.
          </p>

          <h2>Why a closed vocabulary</h2>
          <div data-layout="grid" data-cols="3" data-gap="lg">
            <article data-component="card">
              <div data-slot="header">6 spacing values</div>
              <div data-slot="body">
                7 text sizes. 4 radii. 3 shadows. When a dimension has six options
                instead of sixty, choosing correctly stops being a matter of taste.
              </div>
            </article>
            <article data-component="card">
              <div data-slot="header">One canonical form</div>
              <div data-slot="body">
                An LLM picks between valid alternatives by statistical distribution,
                not reasoning. Canon removes the alternatives.
              </div>
            </article>
            <article data-component="card">
              <div data-slot="header">Prompts ship with it</div>
              <div data-slot="body">
                A ~600-token system prompt makes any model generate valid, consistent
                Canon markup. Tested: zero rule violations.
              </div>
            </article>
          </div>

          <h2>The rules</h2>
          <div data-layout="stack" data-gap="sm">
            <p>1 - Only defined tokens. If a value has no token, it does not exist.</p>
            <p>2 - No inline styles, no extra CSS.</p>
            <p>
              3 - An element gets <code>data-layout</code> or{' '}
              <code>data-component</code>, never both.
            </p>
            <p>
              4 - <code>data-slot</code> only as a direct child of its parent.
            </p>
            <p>
              5 - Dark mode is <code>data-theme=&quot;dark&quot;</code> on{' '}
              <code>&lt;html&gt;</code>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
