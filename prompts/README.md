# Canon prompts

Canon treats its documentation as a technical artifact: the same reference a
human reads is injected into an LLM so it generates consistent Canon markup.

## Files

| File | Size | Use when |
|------|------|----------|
| `system-prompt.txt` | ~600 tokens | Default. The full vocabulary + rules. |
| `system-prompt-full.txt` | ~1600 tokens | The model keeps inventing markup, or you want canonical patterns and anti-patterns included. |

## How to use

**Claude / ChatGPT / any chat UI** — paste the file at the top of your
conversation (or into a Project / custom-instructions field), then ask for UI:

> [paste system-prompt.txt]
>
> Build a settings page with a sidebar and a danger zone card.

**API calls** — send it as the system message:

```python
client.messages.create(
    model="claude-opus-5",
    system=open("prompts/system-prompt.txt").read(),
    messages=[{"role": "user", "content": "Build a pricing page."}],
)
```

**Claude Code / Cursor / agents** — append the file to your project's
`CLAUDE.md` / rules file. Every generation in the repo then speaks Canon.

## Rules of thumb

- The short prompt is enough for models in the GPT-4/Claude-3 class and above.
- If output drifts (inline styles, invented tokens), switch to the full prompt —
  its anti-pattern section is what corrects drift.
- Don't paraphrase the prompts. They are worded so that the closed vocabulary
  reads as a hard constraint, not a suggestion.
