# Groq API Agent Mode

This mode is a standalone CLI agent. Groq acts as the reasoning/tool-calling brain, while Playwright performs browser actions.

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
