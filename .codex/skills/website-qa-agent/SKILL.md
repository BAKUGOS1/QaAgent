# Website QA Agent Skill

Use this skill when the user asks Codex to test a website, CRM flow, lead creation flow, login flow, or UI/UX bugs with this repo.

## Workflow

1. Understand the user task.
2. Confirm safety scope internally. Destructive actions are blocked unless the task explicitly allows them.
3. Run:

```bash
npm run agent:codex -- --task-file <task-file> --headed
```

4. Inspect the generated markdown report in `agent/reports/`.
5. Inspect screenshots in `agent/artifacts/screenshots/` and logs in `agent/artifacts/logs/` if needed.
6. Improve selectors or task steps when a flow needs more precise automation.
7. Re-run failed flows.
8. Produce a final developer-ready bug report.

## Report Style

- Write bugs directly: what error happened, what is broken, where it happened.
- Keep `Issue` concise.
- Keep `Description` clear and complete. Do not cut important details.
- Avoid unnecessary long sentences.
- Use this table shape for user-facing reports: `Module`, `Issue`, `Description`, `Priority`, `Status`.
- Generate Markdown, JSON, and Excel only. Do not generate CSV.
- Excel reports must embed screenshots/images in the workbook when screenshots exist.
- Do not push reports, screenshots, logs, traces, or `.env` files to GitHub.

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
npm run typecheck
```
