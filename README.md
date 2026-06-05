# QA Agent

QA Agent is a professional TypeScript website QA/testing framework with two modes sharing one Playwright browser engine, browser state extractor, QA playbooks, memory layer, test data generator, and report writer.

## 1. What This Project Is

This repo helps test websites and CRM-style flows. It opens pages, captures screenshots, records console/network errors, indexes clickable elements, generates realistic Indian-style CRM lead data, writes local memory, and creates Markdown, JSON, plus Excel reports.

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
npm run agent:state -- --url "https://example.com" --headed
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

Task files live in `agent/tasks/`. They support `websiteUrl`, `task`, `qaProfile`, `credentials`, `testDataCount`, `scope`, `login`, `modules`, `report`, `safety`, and optional explicit `steps`.

Example:

```json
{
  "websiteUrl": "https://example.com",
  "task": "Full professional QA",
  "qaProfile": "full-professional",
  "testDataCount": 10,
  "scope": ["forms", "crud", "search", "pagination"],
  "safety": {
    "allowDelete": false,
    "allowArchive": false,
    "allowPayment": false,
    "allowRealMessageSend": false,
    "allowBulkUpdate": false,
    "allowSettingsChange": false,
    "allowSensitiveExport": false
  }
}
```

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
agent/reports/YYYY-MM-DD-HH-mm-agent-report.xlsx
```

The Excel report includes separate sheets for summary, steps, generated lead data, bugs, UX issues, missing validations, console errors, network errors, and screenshots.
It also includes browser state, QA checklist, and memory notes when available.

Report rules:

- Bug text is direct and clear: what error happened, what is broken, priority, status.
- Descriptions must be complete. Do not cut important details.
- User-facing issue tables use `Module`, `Issue`, `Description`, `Priority`, and `Status`.
- Excel embeds screenshots/images inside the workbook when screenshots exist.
- CSV reports are not generated.
- Reports, screenshots, logs, traces, and `.env` files stay local and are ignored by Git.

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

Browser state:

```text
agent/artifacts/state/latest-browser-state.json
```

The browser state contains URL, title, text sample, buttons, inputs, links, forms, tables, modals, toasts, error messages, console/network errors, screenshot path, and indexed clickable elements.

Example indexed element:

```json
{
  "index": 1,
  "tag": "button",
  "text": "Add Lead",
  "selector": "button:has-text(\"Add Lead\")",
  "role": "button",
  "visible": true,
  "enabled": true
}
```

## 11. QA Profiles And Playbooks

Supported profiles:

- `smoke`
- `functional`
- `ui-ux`
- `regression-basic`
- `accessibility-basic`
- `performance-basic`
- `security-basic`
- `full-professional`

Professional playbooks include auth, forms, CRUD, search/filter/sort, tables/pagination, upload/download, navigation, responsive, accessibility basic, performance basic, security basic, and error states.

## 12. Safety Rules

Blocked by default:

- Delete
- Archive
- Bulk update
- Payment
- Sending real email/SMS/WhatsApp
- Changing password
- Billing/subscription changes
- Inviting users
- Exporting sensitive data
- Modifying account settings
- Real customer data destructive actions

If blocked, the agent reports: `Blocked by safety guard.`

## 13. Memory Rules

Local JSON memory lives in:

```text
agent/memory/sites.json
agent/memory/selectors.json
agent/memory/test-history.json
agent/memory/known-issues.json
agent/memory/playbooks.json
```

Memory can store site notes, known pages, working selectors, failed selectors, previous bugs, common flows, required fields, flaky areas, and last run summaries.

Memory must not store passwords, tokens, cookies, personal customer data, or real sensitive data.

## 14. Browser-Use Inspiration

This repo uses `browser-use` only as architecture inspiration. Browser-use is Python-based; QA Agent remains TypeScript + Playwright. Inspired concepts include browser state extraction, clickable element indexes, custom tools, persistent sessions, screenshots, and task-based actions.

Docs live in:

```text
agent/integrations/browser-use/
```

## 15. Smoke Tests

```bash
npm run typecheck
npm run test:smoke
```

Smoke tests verify Codex mode without API key, Groq missing-key error, browser state, screenshot capture, Markdown/JSON/Excel reports, Excel embedded media, safety guard, and test data generation.

## 16. Run On Another Mac Or Windows Laptop

1. Install Node.js 20+.
2. Clone this repo.
3. Run `npm install`.
4. Run `npx playwright install`.
5. Copy `.env.example` to `.env.local` and add local secrets if using Groq/API mode.
6. Run a smoke test with `npm run agent:codex -- --task-file agent/tasks/example-task.json`.

## 17. Troubleshooting

- If Groq mode says `GROQ_API_KEY is missing`, add it to `.env.local` or use Codex/no-API mode.
- If selectors fail, run `npm run agent:state -- --url "<url>" --headed` and inspect `latest-browser-state.json`.
- If login is needed, set `TEST_EMAIL` and `TEST_PASSWORD` in `.env.local` and reference env names in task JSON.
- If Playwright browser is missing, run `npx playwright install`.

## 18. Limitations

- Codex mode requires Codex to reason interactively.
- Groq mode quality depends on model/tool-calling behavior.
- Complex login and custom CRM flows may need explicit task steps, indexed elements, or selector memory.
- The v1 trace saver is a placeholder; screenshots/logs/reports are implemented.

## 19. Future Upgrade Plan

- Deepen selector healing into every action path.
- Add Playwright trace sessions per run.
- Add visual regression checks.
- Add deeper auth/session profile support without storing secrets.
- Add CI smoke tests.
- Add deeper accessibility checks.
