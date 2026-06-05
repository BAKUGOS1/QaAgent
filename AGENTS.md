# QaAgent Agent Guide

## Purpose

QaAgent is a TypeScript + Playwright QA agent framework for professional website testing. It keeps two modes:

- Codex/no-API mode: Codex reasons in chat; local code provides browser tools, state, screenshots, memory, and reports.
- Groq/API mode: Groq is the standalone API brain; Playwright executes browser actions locally.

## Commands

```bash
npm install
npx playwright install
npm run agent:codex -- --url "https://example.com" --task "Smoke test homepage" --headed
npm run agent:api -- --url "https://example.com" --task "Full professional QA" --headed
npm run agent:state -- --url "https://example.com" --headed
npm run test:smoke
npm run typecheck
```

## Folder Structure

- `agent/src/browser/`: Playwright browser engine, state extractor, smart actions, login/form helpers.
- `agent/src/api-agent/`: Groq/API tool loop.
- `agent/src/codex-agent/`: Codex/no-API driver.
- `agent/src/qa/`: QA engine, playbooks, detectors, priority rules.
- `agent/src/reports/`: Markdown, JSON, Excel reports with screenshot embedding.
- `agent/memory/`: safe local memory for selectors, sites, playbooks, known issues, history.
- `agent/artifacts/state/latest-browser-state.json`: rich browser state with indexed clickable elements.

## QA Standards

Default profile is `full-professional`. Supported profiles: `smoke`, `functional`, `ui-ux`, `regression-basic`, `accessibility-basic`, `performance-basic`, `security-basic`, `full-professional`.

Bug reports must be direct and complete:

- `Issue` is concise.
- `Description` says what error happened, what is broken, and where it happened.
- Do not cut important details.
- Avoid unnecessary long sentences.
- Mark uncertain bugs as `Needs Verification`.

## Report Style

User-facing issue table: `Module`, `Issue`, `Description`, `Priority`, `Status`.

Excel includes summary, bugs, test steps, screenshots, console/network errors, test data, browser state, QA checklist, and memory notes. Screenshots are embedded in the workbook when available.

## Safety Rules

Blocked by default: delete, archive, payment, real message send, bulk update, settings changes, billing/subscription, invites, sensitive export, and real customer destructive edits.

Allowed by default: safe navigation, screenshots, logs, create test data, edit test-created data, validation checks, search/filter/sort, pagination.

## Memory Rules

Memory can store non-sensitive selectors, modules, known forms, known buttons, known issues, flaky areas, required fields, and run summaries.

Memory must never store passwords, tokens, cookies, real customer data, payment data, or sensitive exports.

## Browser-Use Inspiration

Browser-use is Python-based. This repo remains TypeScript + Playwright. Only these ideas are used as inspiration: browser state extraction, indexed clickable elements, custom tool layer, persistent sessions, screenshots, and task-based browser actions.

## Done Criteria

Before finishing code changes, run:

```bash
npm run typecheck
npm run test:smoke
```

For QA validation, run:

```bash
npm run agent:codex -- --url "https://example.com" --task "Smoke test homepage and generate report"
```

