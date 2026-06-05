# Groq API Agent Mode

This mode is a standalone CLI agent. Groq acts as the reasoning/tool-calling brain, while Playwright performs browser actions.
Groq should use the shared tool layer: browser state, indexed clickable elements, selector/text/role clicks, safe fills, screenshots, memory notes, and reports.

Required:

```bash
GROQ_API_KEY=...
```

Run:

```bash
npm run agent:api -- --url "https://example.com" --task "test homepage" --count 3 --headed
npm run agent:api -- --task-file agent/tasks/zoyo-lead-test.json --max-steps 50 --headed
```

If the key is missing, this mode exits with a clear setup error. Codex/no-API mode does not need Groq.
If the key is missing, the repo still keeps Codex/no-API mode available.

Report rules:

- Keep bug/error text direct and clear.
- Say what error happened and what is broken.
- Keep descriptions complete. Do not cut important details.
- Do not generate CSV.
- Do not push reports, screenshots, logs, or local artifacts to GitHub.
- Excel reports embed screenshots when available.
