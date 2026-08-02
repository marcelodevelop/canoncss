import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Playground } from './playground';

export const metadata: Metadata = { title: 'Playground' };

export default function PlaygroundPage() {
  // El CSS real del framework, inyectado en el iframe de preview.
  const css = readFileSync(join(process.cwd(), 'app', 'canon.css'), 'utf-8');

  return (
    <div data-layout="centered" data-width="wide">
      <div data-layout="stack" data-gap="lg" data-padding="xl">
        <div data-layout="stack" data-gap="sm">
          <h1>Playground</h1>
          <p data-tone="subtle">
            Paste the markup your LLM generated — see it rendered with Canon
            instantly. Nothing leaves your browser.
          </p>
        </div>
        <Playground css={css} />
      </div>
    </div>
  );
}
