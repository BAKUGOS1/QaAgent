# Website QA Agent Skill

Use this skill when the user asks Codex to test a website, CRM flow, lead creation flow, login flow, or UI/UX bugs with this repo.

## Workflow

1. Read the user task and identify website, module, profile, safety scope, and needed test data.
2. Create or update a task JSON when the flow needs explicit steps.
3. Use credentials from `.env.local` env refs only. Never paste secrets into task JSON.
4. Confirm safety scope internally. Destructive actions are blocked unless the task explicitly allows them.
5. Run:

```bash
npm run agent:codex -- --task-file <task-file> --headed
```

6. Inspect generated reports in `agent/reports/`.
7. Inspect screenshots in `agent/artifacts/screenshots/`, logs in `agent/artifacts/logs/`, and state in `agent/artifacts/state/latest-browser-state.json`.
8. Use indexed clickable elements from browser state to decide better selectors.
9. Add explicit task steps when needed.
10. Re-run focused tests.
11. Produce a final developer-ready bug report.

## Report Style

- Write bugs directly: what error happened, what is broken, where it happened.
- Keep `Issue` concise.
- Keep `Description` clear and complete. Do not cut important details.
- Avoid unnecessary long sentences.
- Use this table shape for user-facing reports: `Module`, `Issue`, `Description`, `Priority`, `Status`.
- Generate Markdown, JSON, and Excel only. Do not generate CSV.
- Excel reports must embed screenshots/images in the workbook when screenshots exist.
- Do not push reports, screenshots, logs, traces, or `.env` files to GitHub.
- Use browser state indexes when selector guessing is uncertain.
- Keep Codex/no-API and Groq/API modes working.

## Rules

- Never expose secrets.
- Never print passwords in terminal output or reports.
- Never store passwords, tokens, cookies, or sensitive customer data in memory.
- Never perform delete, bulk update, payment, real message send, settings change, password change, or sensitive export unless explicitly allowed.
- If destructive action is detected, stop and report: `Blocked by safety guard.`

## Useful Commands

```bash
npm run agent:codex -- --url "https://example.com" --task "test homepage" --headed
npm run agent:codex -- --task-file agent/tasks/zoyo-lead-test.json --headed
npm run agent:state -- --url "https://example.com" --headed
npm run test:smoke
npm run typecheck
```
