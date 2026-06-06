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
11. Run `npm run quality:gate` before pushing agent framework changes.
12. Produce a final developer-ready bug report.

## Report Style

- Write bugs directly: what error happened, what is broken, where it happened.
- Keep `Issue` concise.
- Keep `Description` clear and complete. Do not cut important details.
- Avoid unnecessary long sentences.
- Do not compress complex evidence into one comma-heavy sentence. If a bug depends on multiple cases, use numbered lines inside the `Description` cell.
- Preferred complex-case format:
  `Result: 1/5 lead conditions saved.`
  `Passed: 1. Tag/source/owner - saved and searchable.`
  `Failed: 1. Minimal contact fields - not searchable after Save. 2. Full address - not searchable after Save.`
- Use this table shape for user-facing reports: `Module`, `Issue`, `Description`, `Priority`, `Status`.
- Generate Excel only by default. Generate Markdown/JSON only when explicitly requested for debugging or automation.
- Do not generate CSV.
- Excel first sheet must be `Bug Report` with only user-facing bug rows.
- Excel second sheet should be `Summary`; technical evidence sheets can follow after that.
- Aggregate repeated duplicate bugs into one clear row. Do not repeat the same bug 10 times unless each row is materially different.
- Excel reports must embed screenshots/images in the workbook when screenshots exist.
- Do not push reports, screenshots, logs, traces, or `.env` files to GitHub.
- Use browser state indexes when selector guessing is uncertain.
- Keep Codex/no-API and Groq/API modes working.
- Prioritize high-risk journeys first: auth, create/save/update, money, data loss, and destructive actions.
- Preserve screenshot/state evidence before marking a flow flaky.
- When a flow fails under one condition, test alternate valid conditions before calling the whole feature failed.
- When reporting condition testing, state both sides clearly with numbered lines: result count, passed cases, failed cases, exact condition names, record names, and what happened in each case.
- Separate save feedback from data persistence. If a form stays open after Save, verify whether the record exists through table refresh, search, pagination, or direct visible evidence.
- If save feedback is wrong or missing, name the exact location, such as `Add Lead drawer footer / Save action`, and state whether success toast, drawer close, or inline error was missing.
- For missing row actions, inspect selected-row toolbar, row action menu, bulk toolbar, hover states, pagination, archive tabs, and exact accessible labels before reporting the action missing.
- If a row/menu action is not found, open the record detail drawer before reporting it missing. Try visible company/detail links and record links, not only plain row/name cells.
- Inspect icon-only buttons by SVG/title/aria/parent button. Trash/delete can appear as an unlabeled `trash` icon inside a detail drawer bottom action area.
- Use exact locators when labels overlap, for example `Select row 1` can also match `Select row 10`.
- If a destructive alternative appears, such as Archive instead of Delete, capture evidence and ask before confirming it unless the user explicitly allowed that action.

## Rules

- Never expose secrets.
- Never print passwords in terminal output or reports.
- Never store passwords, tokens, cookies, or sensitive customer data in memory.
- Never perform delete, bulk update, payment, real message send, settings change, password change, or sensitive export unless explicitly allowed.
- Treat external systems as read-only by default unless the user explicitly asks for a scoped action.
- If destructive action is detected, stop and report: `Blocked by safety guard.`

## Useful Commands

```bash
npm run agent:codex -- --url "https://example.com" --task "test homepage" --headed
npm run agent:codex -- --task-file agent/tasks/zoyo-lead-test.json --headed
npm run agent:state -- --url "https://example.com" --headed
npm run test:smoke
npm run typecheck
npm run quality:gate
```
