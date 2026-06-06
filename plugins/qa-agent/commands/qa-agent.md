---
description: Run safe website QA with the local QaAgent Playwright framework
argument-hint: [website URL or QA task]
---

# QA Agent

Use the QaAgent repo as the execution harness for this request:

$ARGUMENTS

Follow these rules:

1. Read `AGENTS.md` and the `qa-agent` skill before acting.
2. Use `npm run agent:codex` for local/no-API QA unless the user explicitly asks for Groq/API mode.
3. Use credentials only from user-provided runtime values or env refs. Never print or store passwords.
4. Keep delete, archive, payment, real message send, invite, sensitive export, bulk update, and settings changes blocked unless explicitly allowed.
5. Capture screenshots, browser state, trace, console errors, network errors, coverage status, and report paths.
6. Do not commit reports, screenshots, traces, browser state, `.env`, or secrets.
7. Before claiming completion for framework changes, run `npm run typecheck`, `npm run test:smoke`, and `npm run quality:gate`.
