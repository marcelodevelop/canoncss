# Security Policy

Canon is a static CSS file plus a zero-dependency Node linter — no runtime,
no network calls, no data handling. The realistic attack surface is supply
chain (npm package / CDN integrity) and the linter's file handling.

## Reporting a vulnerability

Email **aceescmarcelo@gmail.com** with details and reproduction steps.
Please do not open a public issue for security reports. You should get a
response within 72 hours.

## Scope

- `dist/canon.css`, `src/*.css` — the framework
- `bin/canon-lint.mjs` — the validator
- `plugins/` — the Claude Code plugin

The `site/` Next.js app and `test-llm/` fixtures are demo material.
