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
npm run quality:gate
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

Treat external systems as read-only by default. Do not push, merge, publish, send messages, change credentials, trigger payments, or modify third-party resources unless the user explicitly asks for that exact action.

## ECC-Inspired Quality Gate

This repo borrows the useful ECC idea of a manual quality gate without adopting ECC as a dependency.

Before committing agent framework changes, run:

```bash
npm run quality:gate
```

The gate runs typecheck, smoke tests, high-severity npm audit, secret scan, and latest report sanity.

## Risk And Flaky-Test Rules

Prioritize QA by risk:

- High: auth, money, data loss, create/save/update, destructive actions.
- Medium: forms, search/filter/sort, tables, upload/download, mobile usability.
- Low: copy, spacing, helper text, non-blocking polish.

When a flow is flaky, preserve screenshot/state evidence first, replace fixed time waits with condition waits, and quarantine only after the failure is documented.

## Memory Rules

Memory can store non-sensitive selectors, modules, known forms, known buttons, known issues, flaky areas, required fields, and run summaries.

Memory must never store passwords, tokens, cookies, real customer data, payment data, or sensitive exports.

## External Inspiration

Browser-use is Python-based. This repo remains TypeScript + Playwright. Only these ideas are used as inspiration: browser state extraction, indexed clickable elements, custom tool layer, persistent sessions, screenshots, and task-based browser actions.

ECC is used as process inspiration only: quality gate, security-first workflow, risk-based E2E testing, artifact discipline, and clear agent guide files. Details live in `agent/integrations/ecc/`.

## Done Criteria

Before finishing code changes, run:

```bash
npm run typecheck
npm run test:smoke
npm run quality:gate
```

For QA validation, run:

```bash
npm run agent:codex -- --url "https://example.com" --task "Smoke test homepage and generate report"
```
