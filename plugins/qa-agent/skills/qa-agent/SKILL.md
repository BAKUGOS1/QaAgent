---
name: qa-agent
description: Use when the user asks to test a website, web app, CRM, dashboard, login flow, forms, reports, responsiveness, console/network health, or to generate a QA report with screenshots using the local QaAgent repo.
---

# QA Agent

Use the local QaAgent TypeScript + Playwright repo as the execution harness for safe website QA.

## Operating Rules

- Treat every run as safe QA unless the user explicitly allows data-changing actions.
- Never click or execute delete, archive, payment, mark paid, send email/SMS/WhatsApp, invite, export, download, bulk update, settings change, danger zone, logout, or destructive menu actions by default.
- Credentials may be used only for the requested run. Do not save passwords, tokens, cookies, or customer data in tracked files.
- Prefer runtime environment variables for secrets, for example `TEST_EMAIL` and `TEST_PASSWORD`.
- Save generated evidence under `agent/reports/` and `agent/artifacts/`; these folders are ignored by Git except `.gitkeep`.
- Before claiming completion, report what was covered, what was skipped for safety, and where the evidence files are.

## Setup Check

From the repository root:

```bash
npm install
npx playwright install
npm run typecheck
npm run test:smoke
```

## Safe QA Workflow

1. Confirm the repo root and that the worktree is not being changed unintentionally.
2. Use Playwright through the QaAgent harness or a temporary inline Playwright script.
3. Login only with credentials provided by the user or environment variables.
4. Capture screenshots and state for public/auth pages, authenticated modules, forms, add/edit modals, responsive viewports, console errors, and network failures.
5. Inspect but do not submit forms unless the user explicitly allows test data creation.
6. Generate a concise report with:
   - modules/pages checked
   - key bugs
   - UX issues
   - accessibility findings
   - console/network errors
   - responsive findings
   - skipped risky flows
   - report and screenshot paths

## Useful Commands

```bash
npm run agent:codex -- --url "https://example.com" --task "Smoke test homepage" --headed
npm run agent:state -- --url "https://example.com" --headed
npm run test:smoke
npm run typecheck
```

For task files, prefer credentials through environment references:

```json
{
  "credentials": {
    "emailEnv": "TEST_EMAIL",
    "passwordEnv": "TEST_PASSWORD"
  }
}
```

## Reporting Style

Keep findings direct and actionable:

- **Issue**: concise bug title.
- **Description**: what happened, where it happened, and why it matters.
- **Evidence**: screenshot/report path, URL, console/network detail, or exact module.
- **Priority**: Critical, High, Medium, or Low.
- **Status**: Confirmed, Needs Verification, or Skipped for Safety.

Do not overstate coverage. If destructive flows were skipped, say so clearly.
