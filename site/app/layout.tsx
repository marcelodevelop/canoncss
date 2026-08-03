import type { Metadata } from 'next';
import Link from 'next/link';
import './canon.css';
import './site.css';

export const metadata: Metadata = {
  title: { default: 'Canon CSS', template: '%s - Canon CSS' },
  description:
    'A closed-vocabulary CSS framework designed for LLMs. One right way to do each thing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header data-component="topbar">
          <Link data-slot="brand" href="/">
            Canon
          </Link>
          <nav data-slot="nav">
            <Link href="/tokens">Tokens</Link>
            <Link href="/layouts">Layouts</Link>
            <Link href="/components">Components</Link>
            <Link href="/llm">For LLMs</Link>
            <Link href="/playground">Playground</Link>
            <Link href="/compare">Compare</Link>
          </nav>
          <div data-slot="actions">
            <a
              data-component="button"
              data-variant="secondary"
              data-size="sm"
              href="https://github.com/marcelodevelop/canonframework"
            >
              GitHub
            </a>
          </div>
        </header>

        {children}

        <footer data-layout="centered" data-width="wide">
          <div
            data-layout="row"
            data-gap="md"
            data-justify="between"
            data-align="center"
            data-padding="lg"
            data-wrap
          >
            <p data-tone="subtle">Canon CSS · MIT License</p>
            <div data-layout="row" data-gap="md">
              <Link href="/tokens">Tokens</Link>
              <Link href="/layouts">Layouts</Link>
              <Link href="/components">Components</Link>
              <Link href="/llm">For LLMs</Link>
              <Link href="/playground">Playground</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
