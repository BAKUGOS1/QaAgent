# Codex Agent Mode / No API

This mode does not call any LLM API. Codex does the reasoning in the chat, while this repo provides local Playwright automation, screenshots, logs, test data, memory, and reports.

Run:

```bash
npm run agent:codex -- --url "https://example.com" --task "test homepage" --headed
npm run agent:codex -- --task-file agent/tasks/zoyo-lead-test.json --headed
```

Codex should inspect the generated markdown/JSON report, screenshots, and logs, then continue with more precise task steps or selector fixes when needed.

Report rules:

- Keep bug/error text direct and clear.
- Say what error happened and what is broken.
- Keep descriptions complete. Do not cut important details.
- Do not generate CSV.
- Do not push reports, screenshots, logs, or local artifacts to GitHub.
- Excel reports embed screenshots when available.
