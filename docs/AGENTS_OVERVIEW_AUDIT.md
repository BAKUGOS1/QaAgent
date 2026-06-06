# QA Agent System Overview And Gap Audit

Date: 2026-06-06

## Scope

This audit reviews the current QaAgent repo as an agent product, not only as a TypeScript codebase. Covered areas:

- Repo-level instructions and onboarding: `AGENTS.md`, `README.md`, `docs/PLUGIN_INSTALL.md`
- Installable Codex plugin: `.agents/plugins/marketplace.json`, `plugins/qa-agent/.codex-plugin/plugin.json`, `plugins/qa-agent/skills/qa-agent/SKILL.md`
- Repo-local Codex skill: `.codex/skills/website-qa-agent/SKILL.md`
- CLI agent modes: `agent:codex`, `agent:api`, `agent:state`
- Browser execution layer: Playwright browser agent, smart actions, page analyzer, login helper
- QA layer: QA engine, checks, issue detector, playbooks, priority rules
- Reporting layer: Markdown, JSON, Excel, screenshots, browser state
- Safety, memory, quality gate, and packaging readiness

## Executive Summary

QaAgent has a strong foundation: TypeScript + Playwright, two operating modes, local state extraction, Excel-first reporting, a documented safety posture, an installable Codex plugin scaffold, and a working quality gate. It is already useful as a local professional QA toolkit.

## Implementation Update - 2026-06-07

The first implementation pass addressed the highest-impact gaps:

- Codex, Groq/API, and state-only flows now use configured smart login when `login.enabled` is true.
- Reports now include coverage truth: modules/scopes, actions attempted, evidence, status, blockers, and confidence.
- Partial or incomplete coverage now affects final QA status and appears in the first user-facing report sheet instead of looking like a clean pass.
- Playwright trace capture now writes trace zip files under `agent/artifacts/traces/`.
- The installable plugin skill now matches the stronger repo-local QA workflow.
- Claude Code plugin metadata and a `/qa-agent` command were added under `plugins/qa-agent/`.
- Quality gate secret scanning now covers plugin, marketplace, docs, package, and security/contribution surfaces.

The main gap is that the repo currently presents itself like a full autonomous QA agent, but several core parts are still shallow or adapter-only:

- Codex and Claude Code plugin surfaces now exist; Antigravity/other hosts are documented through direct repo usage until their native plugin format is confirmed.
- Codex mode opens the page, handles configured login, optionally executes explicit user steps, and reports coverage truth. It still does not run a full deterministic module crawler by itself.
- Smart login is now wired into Codex, Groq/API, and state-only flows when `login.enabled` is true.
- The installable plugin skill has been upgraded to the stronger repo-local QA workflow.
- The safety model is text-pattern based, not intent-based.
- Trace support now writes Playwright trace zip files.
- The quality gate now scans plugin/docs/marketplace surfaces for secrets.

## Agent Surface Map

| Surface | Current Role | Main Files |
|---|---|---|
| Repo agent guide | Tells future agents how to work in this repo | `AGENTS.md` |
| Installable Codex plugin | Lets another Codex setup install QaAgent as a plugin | `.agents/plugins/marketplace.json`, `plugins/qa-agent/.codex-plugin/plugin.json` |
| Installable skill | Exposes QA Agent behavior after plugin install | `plugins/qa-agent/skills/qa-agent/SKILL.md` |
| Repo-local Codex skill | Stronger local workflow for this checkout | `.codex/skills/website-qa-agent/SKILL.md` |
| Codex/no-API mode | Local browser tools, Codex reasons in chat | `agent/src/codex-agent/codex-driver.ts`, `agent/src/codex-agent/codex-task-runner.ts` |
| Groq/API mode | Groq model chooses tools, Playwright executes locally | `agent/src/api-agent/groq-tool-loop.ts`, `agent/src/api-agent/groq-tool-definitions.ts` |
| Browser layer | Navigation, screenshots, actions, state extraction | `agent/src/browser/` |
| QA layer | Heuristic issue detection and report model | `agent/src/qa/` |
| Reports | Markdown, JSON, Excel with screenshots/state | `agent/src/reports/` |
| Quality gate | Typecheck, smoke, audit, secret scan, report sanity | `agent/scripts/quality-gate.ts` |

## What Is Working Well

| Area | Status |
|---|---|
| TypeScript build health | `npm run quality:gate` passes, including `typecheck` |
| Smoke test health | `npm run quality:gate` passes `npm run test:smoke` |
| Dependency audit | `npm run quality:gate` reports 0 high npm vulnerabilities |
| Report generation | Latest Excel report is structurally present during quality gate |
| Plugin manifest | `plugins/qa-agent` validates with the Codex plugin validator |
| Git hygiene | Runtime reports, screenshots, and browser state are ignored |
| Safety intent | Clear allowed/blocked action rules exist in `AGENTS.md` and code |
| Documentation | README, install guide, and repo guide explain core commands |
| Browser state | Indexed clickable elements and rich page state exist |
| Reports | Markdown, JSON, Excel, screenshots, console/network/error sections exist |

## Gap Findings

| ID | Priority | Area | Gap | Evidence | Recommended Fix |
|---|---:|---|---|---|---|
| G1 | P0 | Cross-agent packaging | Implemented for Claude Code; Antigravity remains documented direct-repo usage until its native format is confirmed. | Codex files exist under `.agents/plugins/`; Claude files now exist under `plugins/qa-agent/.claude-plugin/` and `plugins/qa-agent/commands/`. | Verify Claude install on a clean machine and add native Antigravity manifest if/when a stable format is confirmed. |
| G2 | P0 | Install verification | Plugin install docs exist, but local runtime install was not verified because local `codex.exe` returned `Access is denied` during setup verification. | `docs/PLUGIN_INSTALL.md` documents `codex plugin marketplace add .` and `codex plugin add qa-agent@qa-agent-marketplace`; manifest validation passes, but actual install command needs clean-machine verification. | Test install on a fresh Codex environment. Add a short "Verified on" section with OS, Codex version, commands, and expected output. |
| G3 | P0 | Skill parity | Implemented. Installable plugin skill now carries the stronger QA workflow. | `plugins/qa-agent/skills/qa-agent/SKILL.md` includes condition evidence, exact selectors, persistence checks, icon-only controls, destructive-action alternatives, and Excel/report rules. | Keep local and installable skill guidance in sync when future QA rules change. |
| G4 | P0 | Login automation | Implemented. `smartLogin` is wired into Codex, Groq/API, and state-only flows. | `agent/src/browser/login-runner.ts` calls `smartLogin`; drivers use `login.enabled` and env-backed credentials without printing secrets. | Add more app-specific login selector examples over time. |
| G5 | P0 | Agent depth | Codex/no-API mode is mostly "open URL, run explicit steps, analyze final state." It is not yet a full autonomous professional QA runner. | `codex-driver.ts` opens the URL, runs explicit steps, screenshots, extracts final state, and calls QA engine. | Add a deterministic QA journey runner: auth, nav discovery, module crawl, forms, tables, filters, pagination, create/edit test data, save verification, logout/session checks. |
| G6 | P1 | Groq/API reliability | Partially implemented. API mode now starts from target URL, runs configured smart login, and reports coverage truth, but deep coverage still depends on model/tool choices. | `groq-tool-loop.ts` builds coverage after the tool loop and applies coverage-aware final status. | Add deterministic required-action gates inside the tool loop so the model cannot stop early when required modules remain untested. |
| G7 | P1 | QA engine | The QA engine is heuristic over captured state, not a full playbook executor. | `qa-engine.ts`, `issue-detector.ts`, and `checks.ts` focus on console/network/basic UX/validation signals. | Promote playbooks into executable checklists with assertions and expected evidence. Store module-wise pass/fail, not just discovered issues. |
| G8 | P1 | Trace support | Implemented. Browser trace saving writes zip files under ignored artifacts. | `BrowserAgent.saveTrace()` now stops Playwright tracing and returns a trace zip path. | Add trace opening instructions in a future docs pass. |
| G9 | P1 | Safety model | Safety guard is text-pattern based. It may block harmless text or miss icon-only destructive actions. | `agent/src/shared/safety-guard.ts` checks words like delete/archive/payment/invite. | Introduce typed action intents: `safe_navigation`, `test_data_create`, `test_data_edit`, `destructive`, `payment`, `external_message`, `sensitive_export`. Require explicit user approval for unsafe intents. |
| G10 | P1 | Quality gate coverage | Implemented. Secret scan roots now include plugin, marketplace, docs, package, and security/contribution surfaces. | `quality-gate.ts` scans `plugins/`, `.agents/`, `docs/`, `SECURITY.md`, `CONTRIBUTING.md`, package files, and env examples. | Keep future public-facing folders inside the scan list. |
| G11 | P1 | Persistent browser profile | Persistent profile storage is useful, but cleanup and privacy controls are under-documented. | `.gitignore` ignores `agent/.browser-profile/`, but docs do not clearly expose a cleanup/reset command. | Add `npm run agent:profile:clean` and docs warning that cookies/session data may live locally. |
| G12 | P2 | Memory contributor friction | Smoke and multi-site runs can modify tracked memory JSON files. | Quality gate smoke modified `agent/memory/sites.json` and `agent/memory/test-history.json`; they had to be restored after the audit. | Separate seed memory from runtime memory, for example `agent/memory-seed/` tracked and `agent/memory-runtime/` ignored. |
| G13 | P2 | Multi-site audit | `multi-site-audit.ts` is useful but hardcoded and not exposed as a general task-driven capability. | Script contains specific public sites and Zybra-related environment assumptions. | Convert it into a config-driven batch runner with a YAML/JSON site list and credential references via env only. |
| G14 | P2 | Report truth contract | Implemented baseline. Reports now include tested/not-tested coverage tables and incomplete coverage can create a first-sheet issue row. | Markdown/Excel reports include coverage module, actions, evidence, status, blocker, confidence, and trace path. | Improve this further with executable module assertions and richer screenshot-to-coverage mapping. |

## Recommended Roadmap

### Must Fix Now

1. Clean-machine verify Codex and Claude plugin install commands.
2. Add a deterministic module crawler so full-professional runs can visit modules without hand-written steps.
3. Promote playbooks into executable assertions with module-wise pass/fail evidence.
4. Replace text-pattern-only safety with typed action intent.

### Should Fix Next

1. Add a browser profile cleanup command and docs.
2. Separate tracked seed memory from ignored runtime memory.
3. Make multi-site audits config-driven.
4. Add CI workflow for typecheck, smoke, plugin validation, and quality gate.
5. Add trace opening instructions for Playwright trace viewer.

### Later

1. Add native Antigravity/Cursor-style install adapters when stable host formats are confirmed.
2. Add example reports for one public demo site and one authenticated demo flow.

## Verification Performed

These checks were run during the audit:

```bash
npm run quality:gate
```

Quality gate passed:

- `typecheck`: pass
- `test:smoke`: pass
- `npm-audit-high`: pass, 0 vulnerabilities
- `secret-scan`: pass for currently configured roots
- `report-sanity`: pass, latest Excel report structurally present

The Codex plugin manifest was also validated earlier with the Codex plugin validator and passed. Runtime plugin installation still needs a clean-machine check because the local Codex executable hit an `Access is denied` blocker during install verification.

## Suggested Implementation Prompt

Use this prompt for the next implementation pass:

```text
You are working in C:\Users\MOHIT KUMAR\OneDrive\Documents\QaAgent.

Goal: make QaAgent a truly installable and reliable professional QA agent, not only a repo-local toolkit.

Start by reading AGENTS.md and docs/AGENTS_OVERVIEW_AUDIT.md. Preserve unrelated worktree changes.

Implement the next reliability items from the audit:
1. Clean-machine verify Codex and Claude plugin install commands. Document exact host versions and output.
2. Add a deterministic module crawler for full-professional runs: navigation discovery, safe module visit, screenshots, forms/tables/search/filter/pagination probes, and not-tested blockers.
3. Promote playbooks into executable assertions with module-wise pass/fail evidence.
4. Replace text-pattern-only safety with typed action intent.
5. Add browser profile cleanup docs/command and separate tracked seed memory from ignored runtime memory.

After changes, run:
npm run typecheck
npm run test:smoke
npm run quality:gate

Also run the Codex plugin validator against plugins/qa-agent if available.
Keep generated reports/artifacts ignored, and do not commit runtime screenshots or secrets.
```
