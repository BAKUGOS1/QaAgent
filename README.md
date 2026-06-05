# QA Agent

QA Agent is a lightweight TypeScript website QA/testing project with two modes sharing one Playwright browser engine, QA checker, memory layer, test data generator, and report writer.

## 1. What This Project Is

This repo helps test websites and CRM-style flows. It opens pages, captures screenshots, records console/network errors, generates realistic Indian-style CRM lead data, writes local memory, and creates Markdown plus JSON reports.

## 2. Two Modes Explained

Codex Agent Mode / No API:
Codex does the reasoning in chat. The repo provides local browser automation tools, task files, screenshots, logs, memory, generated test data, and reports. No OpenAI, Groq, Anthropic, Letta, Mastra, LangGraph, Mem0, Zep, or Graphiti dependency is required.

Groq API Agent Mode:
This is a standalone CLI mode. Groq is the external API brain and chooses safe Playwright tool calls. Playwright still performs all browser actions locally.

## 3. Install Steps

```bash
npm install
```

## 4. Playwright Install

```bash
npx playwright install
```

## 5. Run Codex / No-API Mode

```bash
npm run agent:codex -- --url "https://example.com" --task "test login flow" --headed
npm run agent:codex -- --task-file agent/tasks/zoyo-lead-test.json --headed
```

Codex/no-API mode is not a standalone AI brain. It works because Codex itself operates the repo and Playwright harness.

## 6. Run Groq / API Mode

Create `.env.local` or `.env`:

```bash
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b
```

Run:

```bash
npm run agent:api -- --url "https://example.com" --task "test full CRM lead creation flow" --count 10 --headed
npm run agent:api -- --task-file agent/tasks/zoyo-lead-test.json --headed
npm run agent:api -- --task-file agent/tasks/zoyo-lead-test.json --max-steps 75 --headed
```

Groq/API mode is standalone because it has an external model API brain.

## 7. Use Task JSON

Task files live in `agent/tasks/`. They support `websiteUrl`, `task`, `credentials`, `testDataCount`, `scope`, `safety`, and optional explicit `steps`.

## 8. Credentials Safely

Credentials can come from runtime env vars or task JSON env references:

```json
{
  "credentials": {
    "emailEnv": "TEST_EMAIL",
    "passwordEnv": "TEST_PASSWORD"
  }
}
```

Never commit `.env` or `.env.local`. Passwords are not written to memory or reports.

## 9. Reports

Reports are saved to:

```text
agent/reports/YYYY-MM-DD-HH-mm-agent-report.md
agent/reports/YYYY-MM-DD-HH-mm-agent-report.json
```

## 10. Screenshots And Logs

Screenshots:

```text
agent/artifacts/screenshots/
```

Logs:

```text
agent/artifacts/logs/
```

Traces:

```text
agent/artifacts/traces/
```

## 11. Safety Rules

Blocked by default:

- Delete
- Bulk update
- Payment
- Sending real email/SMS/WhatsApp
- Changing password
- Exporting sensitive data
- Modifying account settings
- Real customer data destructive actions

If blocked, the agent reports: `Blocked by safety guard.`

## 12. Memory Rules

Local JSON memory lives in:

```text
agent/memory/sites.json
agent/memory/selectors.json
agent/memory/test-history.json
```

Memory can store site notes, known pages, working selectors, previous bugs, common flows, and last run summaries.

Memory must not store passwords, tokens, cookies, personal customer data, or real sensitive data.

## 13. Run On Another Mac Or Windows Laptop

1. Install Node.js 20+.
2. Clone this repo.
3. Run `npm install`.
4. Run `npx playwright install`.
5. Copy `.env.example` to `.env.local` and add local secrets if using Groq/API mode.
6. Run a smoke test with `npm run agent:codex -- --task-file agent/tasks/example-task.json`.

## 14. Limitations

- Codex mode requires Codex to reason interactively.
- Groq mode quality depends on model/tool-calling behavior.
- Complex login and custom CRM flows may need explicit task steps or selectors.
- The v1 trace saver is a placeholder; screenshots/logs/reports are implemented.

## 15. Future Upgrade Plan

- Add richer selector healing.
- Add Playwright trace sessions per run.
- Add visual regression checks.
- Add auth/session profile support without storing secrets.
- Add CI smoke tests.
- Add deeper accessibility checks.
