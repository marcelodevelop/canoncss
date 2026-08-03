import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CopyButton } from './copy-button';

export const metadata: Metadata = { title: 'For LLMs' };

// El prompt se lee del repo en build time: una sola fuente de verdad.
function readPrompt(name: string): string {
  return readFileSync(join(process.cwd(), '..', 'prompts', name), 'utf-8');
}

export default function Llm() {
  const short = readPrompt('system-prompt.txt');
  const full = readPrompt('system-prompt-full.txt');

  return (
    <div data-layout="centered" data-width="content">
      <div data-layout="stack" data-gap="xl" data-padding="2xl">
        <div data-layout="stack" data-gap="sm">
          <h1>For LLMs</h1>
          <p data-tone="subtle">
            Canon&apos;s documentation is a technical artifact: the same reference a
            human reads is injected into a model so it generates consistent markup.
          </p>
        </div>

        <h2>How to use</h2>
        <div data-layout="stack" data-gap="sm">
          <p>
            <strong>Chat UIs</strong> - paste the prompt at the top of your
            conversation, then ask for UI.
          </p>
          <p>
            <strong>API calls</strong> - send it as the system message.
          </p>
          <p>
            <strong>Claude Code / Cursor / agents</strong> - append it to your{' '}
            <code>CLAUDE.md</code> or rules file. Every generation in the repo then
            speaks Canon.
          </p>
        </div>

        <div data-layout="row" data-gap="sm" data-justify="between" data-align="center" data-wrap>
          <div data-layout="row" data-gap="sm" data-align="center">
            <h2>system-prompt.txt</h2>
            <span data-component="badge" data-variant="brand">
              ~600 tokens
            </span>
          </div>
          <CopyButton text={short} />
        </div>
        <pre>
          <code>{short}</code>
        </pre>

        <div data-layout="row" data-gap="sm" data-justify="between" data-align="center" data-wrap>
          <div data-layout="row" data-gap="sm" data-align="center">
            <h2>system-prompt-full.txt</h2>
            <span data-component="badge">~1600 tokens</span>
          </div>
          <CopyButton text={full} />
        </div>
        <p data-tone="subtle">
          Use the full prompt when output drifts - its anti-pattern section is what
          corrects drift.
        </p>
        <pre>
          <code>{full}</code>
        </pre>
      </div>
    </div>
  );
}
