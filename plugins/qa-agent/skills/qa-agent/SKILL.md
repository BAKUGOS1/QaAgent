---
name: qa-agent
description: Use when the user asks to test a website, CRM flow, login flow, dashboard, form, report, responsiveness, console/network health, UI/UX bugs, or to generate a QA report with screenshots using the local QaAgent repo.
---

# QA Agent

Use the local QaAgent TypeScript + Playwright repo as the execution harness for safe professional website QA.

## Workflow

1. Confirm the repo root and inspect the requested website, module, QA profile, safety scope, and test data needs.
2. Create or update a task JSON when the flow needs explicit selectors, credentials, modules, or repeatable steps.
3. Use credentials from environment references only, such as `TEST_EMAIL` and `TEST_PASSWORD`. Never paste secrets into task JSON.
4. Confirm safety scope internally. Destructive actions are blocked unless the user explicitly allows them.
5. Run:

```bash
npm run agent:codex -- --task-file <task-file> --headed
```

6. Inspect generated reports in `agent/reports/`.
7. Inspect screenshots in `agent/artifacts/screenshots/`, traces in `agent/artifacts/traces/`, and state in `agent/artifacts/state/latest-browser-state.json`.
8. Use indexed clickable elements from browser state to choose selectors.
9. Add explicit Cypress-style assertion steps when deterministic coverage is missing.
10. Re-run focused tests until the report honestly separates tested, partially tested, blocked, and not-tested areas.
11. Run `npm run quality:gate` before pushing framework changes.
12. Produce a final developer-ready bug report with report and evidence paths.

## Report Style

- Write bugs directly: what error happened, what is broken, where it happened.
- Use specific module/submodule names, not only generic module names. Examples: `Leads Table`, `Lead form`, `Lead form - Tags`, `Lead form - Side pane`, `Lead detail drawer`, `Lead delete`.
- Keep `Issue` concise.
- Keep `Description` clear and complete. Do not cut important details.
- Avoid unnecessary long sentences.
- Do not compress complex evidence into one comma-heavy sentence. If a bug depends on multiple cases, use numbered lines inside the `Description` cell.
- Preferred complex-case format:
  `Result: 1/5 lead conditions saved.`
  `Passed: 1. Tag/source/owner - saved and searchable.`
  `Failed: 1. Minimal contact fields - not searchable after Save. 2. Full address - not searchable after Save.`
- Use this table shape for user-facing reports: `Module`, `Issue`, `Description`, `Priority`, `Status`, `Screenshot`.
- Generate Excel only by default. Generate Markdown/JSON only when explicitly requested for debugging or automation.
- Do not generate CSV.
- Excel first sheet must be `Bug Report` with only user-facing bug rows.
- Excel second sheet should be `Summary`; technical evidence and coverage sheets can follow after that.
- Excel reports should be readable without manual fixing: practical column widths, wrapped text, dynamic row heights, frozen/filter headers, and colored header/priority/status cells.
- Aggregate repeated duplicate bugs into one clear row. Do not repeat the same bug many times unless each row is materially different.
- Excel reports must embed screenshots/images in the workbook when screenshots exist.
- The first `Bug Report` sheet must include a `Screenshot` column. If an issue has screenshot evidence, place the image directly inside that row's screenshot cell, not only in a separate screenshots sheet.
- Check the `Command Log` sheet for retry attempts, failures, and failure screenshot paths before deciding a bug is confirmed or flaky.
- Reports must include coverage truth: modules/scopes tested, actions attempted, evidence, status, blockers, and confidence.
- Do not push reports, screenshots, logs, traces, browser state, or `.env` files to GitHub.

## QA Rules

- Use browser state indexes when selector guessing is uncertain.
- Prefer `assert_visible`, `assert_text`, `assert_url_includes`, and `assert_count` over hard waits for dynamic UI checks.
- Use fixture references such as `fixture:example-user.email` or `"fixture": "example-user.email"` for reusable non-sensitive values.
- Keep Codex/no-API and Groq/API modes working.
- Prioritize high-risk journeys first: auth, create/save/update, money, data loss, and destructive actions.
- Preserve screenshot/state/trace evidence before marking a flow flaky.
- When a flow fails under one condition, test alternate valid conditions before calling the whole feature failed.
- When reporting condition testing, state both sides clearly with numbered lines: result count, passed cases, failed cases, exact condition names, record names, and what happened in each case.
- Separate save feedback from data persistence. If a form stays open after Save, verify whether the record exists through table refresh, search, pagination, or direct visible evidence.
- If save feedback is wrong or missing, name the exact location, such as `Add Lead drawer footer / Save action`, and state whether success toast, drawer close, or inline error was missing.
- Never trust toast text alone. After success/failure toasts, inspect network responses, console errors, inline validation, and final table/search state.
- If UI says success but API says error, report the mismatch.
- For delete flows, verify whether the API requires archive-first or another precondition. If response says something like `Only archived leads can be deleted`, report the wrong success toast and the unmet delete precondition.
- For missing row actions, inspect selected-row toolbar, row action menu, bulk toolbar, hover states, pagination, archive tabs, and exact accessible labels before reporting the action missing.
- If a row/menu action is not found, open the record detail drawer before reporting it missing. Try visible company/detail links and record links, not only plain row/name cells.
- Inspect icon-only buttons by SVG/title/aria/parent button metadata. Trash/delete can appear as an unlabeled `trash` icon inside a detail drawer bottom action area.
- Use exact locators when labels overlap. For example, `Select row 1` can also match `Select row 10`.
- If a destructive alternative appears, such as Archive instead of Delete, capture evidence and ask before confirming it unless the user explicitly allowed that action.

## Safety Rules

- Never expose secrets.
- Never print passwords in terminal output or reports.
- Never store passwords, tokens, cookies, or sensitive customer data in memory.
- Never perform delete, archive, bulk update, payment, real message send, invite, settings change, password change, or sensitive export unless explicitly allowed.
- Treat external systems as read-only by default unless the user explicitly asks for a scoped action.
- If destructive action is detected, stop and report: `Blocked by safety guard.`

## Task File Pattern

Prefer credentials through environment references:

```json
{
  "websiteUrl": "https://example.com",
  "task": "Login and test safe modules.",
  "qaProfile": "full-professional",
  "scope": ["login", "navigation", "forms", "console", "network", "screenshot"],
  "credentials": {
    "emailEnv": "TEST_EMAIL",
    "passwordEnv": "TEST_PASSWORD"
  },
  "login": {
    "enabled": true,
    "loginUrl": "https://example.com/login",
    "successUrlIncludes": "/dashboard"
  },
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

## Useful Commands

```bash
npm install
npx playwright install
npm run agent:codex -- --url "https://example.com" --task "test homepage" --headed
npm run agent:codex -- --task-file agent/tasks/example-task.json --headed
npm run agent:api -- --task-file agent/tasks/example-task.json --headed
npm run agent:state -- --url "https://example.com" --headed
npm run test:smoke
npm run typecheck
npm run quality:gate
```
