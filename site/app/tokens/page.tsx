import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tokens' };

const SPACING = [
  ['--space-xs', '0.25rem / 4px'],
  ['--space-sm', '0.5rem / 8px'],
  ['--space-md', '1rem / 16px'],
  ['--space-lg', '1.5rem / 24px'],
  ['--space-xl', '2.5rem / 40px'],
  ['--space-2xl', '4rem / 64px'],
];

const TYPE = [
  ['--text-xs', '0.75rem / 12px'],
  ['--text-sm', '0.875rem / 14px'],
  ['--text-md', '1rem / 16px — body'],
  ['--text-lg', '1.125rem / 18px'],
  ['--text-xl', '1.5rem / 24px'],
  ['--text-2xl', '2rem / 32px'],
  ['--text-3xl', '3rem / 48px'],
];

const COLORS = [
  ['--color-brand', 'Primary actions, links'],
  ['--color-brand-subtle', 'Brand tints, focus rings'],
  ['--color-accent', 'Single sharp accent'],
  ['--color-surface', 'Page background'],
  ['--color-surface-raised', 'Cards, panels, sidebars'],
  ['--color-surface-sunken', 'Wells, footers'],
  ['--color-content', 'Body text'],
  ['--color-content-subtle', 'Secondary text'],
  ['--color-border', 'Default borders'],
  ['--color-border-strong', 'Inputs, emphasis borders'],
  ['--color-success', 'Status — has a -subtle tint'],
  ['--color-warning', 'Status — has a -subtle tint'],
  ['--color-error', 'Status — has a -subtle tint'],
  ['--color-info', 'Status — has a -subtle tint'],
];

export default function Tokens() {
  return (
    <div data-layout="centered" data-width="content">
      <div data-layout="stack" data-gap="xl" data-padding="2xl">
        <div data-layout="stack" data-gap="sm">
          <h1>Tokens</h1>
          <p data-tone="subtle">
            The complete vocabulary. If a value has no token, it does not exist.
          </p>
        </div>

        <h2>Spacing — 6 levels</h2>
        <table>
          <tbody>
            {SPACING.map(([token, value]) => (
              <tr key={token}>
                <td>
                  <code>{token}</code>
                </td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Type scale — 7 levels</h2>
        <table>
          <tbody>
            {TYPE.map(([token, value]) => (
              <tr key={token}>
                <td>
                  <code>{token}</code>
                </td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Headings <code>h1</code>–<code>h6</code> map onto the scale automatically
          (<code>h1</code> = 3xl … <code>h6</code> = sm). Never restyle them.
        </p>

        <h2>Color — semantic</h2>
        <table>
          <tbody>
            {COLORS.map(([token, role]) => (
              <tr key={token}>
                <td>
                  <span className="swatch" style={{ background: `var(${token})` }} />
                  <code>{token}</code>
                </td>
                <td>{role}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Radius, shadow, typography, motion</h2>
        <table>
          <tbody>
            <tr>
              <td>Radius</td>
              <td>
                <code>{'--radius-{sm|md|lg|full}'}</code>
              </td>
            </tr>
            <tr>
              <td>Shadow</td>
              <td>
                <code>{'--shadow-{sm|md|lg}'}</code>
              </td>
            </tr>
            <tr>
              <td>Fonts</td>
              <td>
                <code>{'--font-{sans|mono}'}</code>
              </td>
            </tr>
            <tr>
              <td>Weight</td>
              <td>
                <code>{'--weight-{normal|medium|bold}'}</code>
              </td>
            </tr>
            <tr>
              <td>Leading</td>
              <td>
                <code>{'--leading-{tight|normal|loose}'}</code>
              </td>
            </tr>
            <tr>
              <td>Motion</td>
              <td>
                <code>--ease-default</code>, <code>{'--duration-{fast|normal|slow}'}</code>
              </td>
            </tr>
          </tbody>
        </table>

        <h2>Dark mode</h2>
        <pre>
          <code>{`<html data-theme="dark">`}</code>
        </pre>
        <p>
          Surfaces, content, borders and subtle tints all remap. Systems set to dark
          get it automatically via <code>prefers-color-scheme</code> unless you pin{' '}
          <code>data-theme=&quot;light&quot;</code>.
        </p>

        <h2>Theming</h2>
        <pre>
          <code>{`:root {
  --color-brand: #0ea5e9;   /* the only sanctioned override point */
}`}</code>
        </pre>
      </div>
    </div>
  );
}
