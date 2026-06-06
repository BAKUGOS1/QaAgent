# QA Agent Sample Report

This is a compact example of the report shape QA Agent generates. Real runs write Excel by default and can optionally write Markdown/JSON when enabled in the task file.

## Run Summary

| Field | Value |
|---|---|
| Website | `https://example.com` |
| Task | Smoke test homepage and generate report |
| Mode | Codex / no-API |
| Browser | Playwright Chromium |
| Final Status | Partial Pass |
| Coverage Confidence | Medium |
| Login Result | No credentials provided |

## Bug Report

| Module | Issue | Description | Priority | Status |
|---|---|---|---|---|
| Login | Success not verified | Login was requested but no success URL or success text evidence was collected. | High | Needs Verification |
| Coverage | Module not tested | Reports page was in scope, but the run did not collect deterministic visit or screenshot evidence for it. | Medium | Not Tested |
| Console | Runtime error | Browser console captured a runtime error during navigation. Stack details are kept in the technical evidence sheet. | High | Open |

## Coverage

| Module | Actions Attempted | Evidence | Status | Confidence |
|---|---|---|---|---|
| Smoke | Opened URL, captured screenshot, saved browser state | Screenshot and state file captured | Pass | High |
| Navigation | Indexed visible links/buttons | Needs deeper click-through evidence | Needs Verification | Medium |
| Reports | No matching URL, selector, or screenshot evidence | Scope requested but not reached | Not Tested | Low |
| Console | Captured browser console messages | 1 console error found | Needs Verification | Medium |
| Network | Captured failed requests | No failed network requests | Pass | High |

## Evidence Artifacts

| Artifact | Example Path |
|---|---|
| Excel report | `agent/reports/YYYY-MM-DD-HH-mm-agent-report.xlsx` |
| Markdown report | `agent/reports/YYYY-MM-DD-HH-mm-agent-report.md` |
| JSON report | `agent/reports/YYYY-MM-DD-HH-mm-agent-report.json` |
| Screenshots | `agent/artifacts/screenshots/` |
| Browser state | `agent/artifacts/state/latest-browser-state.json` |
| Playwright trace | `agent/artifacts/traces/YYYY-MM-DD-HH-mm-trace.zip` |

## What Developers Get

- A first-sheet bug table with `Module`, `Issue`, `Description`, `Priority`, and `Status`.
- Coverage truth so incomplete testing is visible instead of hidden behind a clean pass.
- Screenshot, trace, console, network, browser state, and action-step evidence.
- Safety notes for skipped destructive actions.
- Optional Markdown/JSON outputs for debugging and automation.
