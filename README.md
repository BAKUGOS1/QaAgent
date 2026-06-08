<h1 align="center">⚡ QaAgent</h1>

<p align="center">
  <strong>Autonomous, Local-first TypeScript + Playwright QA Automation Engine for Enterprise Web Applications.</strong>
</p>

<p align="center">
  Test authentication paths, multi-page flows, dynamic forms, complex data tables, accessibility issues, performance metrics, and safety rules with robust, evidence-rich, auto-generated Excel reports.
</p>

<p align="center">
  <a href="https://github.com/BAKUGOS1/QaAgent/actions/workflows/quality.yml">
    <img alt="Quality Gate" src="https://github.com/BAKUGOS1/QaAgent/actions/workflows/quality.yml/badge.svg">
  </a>
  <img alt="Node 20+" src="https://img.shields.io/badge/node-%3E%3D20-339933">
  <img alt="Playwright" src="https://img.shields.io/badge/browser-Playwright-45ba4b">
  <img alt="TypeScript" src="https://img.shields.io/badge/language-TypeScript-3178c6">
  <img alt="Reports" src="https://img.shields.io/badge/reports-Excel%20%2B%20screenshots-f59e0b">
</p>

---

## 🌟 What It Does

QaAgent runs a local, highly-instrumented Playwright browser, captures trace evidence, detects deep quality/usability defects, and produces professional, self-contained Excel workbooks.

* **Autonomous Crawling & Testing**: In Codex/no-API mode, the agent automatically discovers links, sidebar items, tabs, and modals within the same origin, tests form validation, and takes full-page screenshots at every step.
* **Dual Execution Modes**: Choose **Codex/no-API mode** (ideal for local-first execution with local credentials) or **Groq API mode** (autonomous agent CLI loop utilizing model-driven tool calls).
* **Multi-Strategy Selector Healing**: Automatically attempts to recover from failing CSS selectors using selectors history memory, text hints, ARIA roles, or indexed state coordinates before raising a failure.
* **Two-Tier Safety Guard**: A proactive firewall blocking destructive actions (deletes, settings alterations, payments, bulk updates, and message broadcast sends) by default. Safe tools bypass checks to eliminate false positives.
* **Fleshed-out QA Detectors**: Automated DOM audits checking for accessibility faults, invalid forms, pagination/horizontal scrolling failures in tables, and console/network bottlenecks.
* **Misleading UI Detection**: An API response interceptor capturing HTTP payloads to confirm if a user-facing success toast matches the actual server API response.

---

## 📦 60-Second Install

Clone the repository and build:
```bash
git clone https://github.com/BAKUGOS1/QaAgent.git
cd QaAgent
npm install
npx playwright install
npm run quality:gate
```

Run a public homepage exploration:
```bash
npm run agent:codex -- --url "https://example.com" --task "Explore homepage and generate QA report" --headed
```

Run with a task file:
```bash
npm run agent:codex -- --task-file agent/tasks/example-task.json --headed
```

---

## 🏛️ Architecture & System Design

```mermaid
flowchart LR
    URL[Website URL] ──► Agent[BrowserAgent]
    Agent ──► Explorer[Autonomous Crawler]
    Explorer ──► Interceptor[Network/API Interceptor]
    Explorer ──► Healer[Selector Healer]
    Agent ──► Detectors[QA Audit Detectors]
    Detectors ──► Excel[Zero-Dep Excel Writer]
```

Read the full system architecture specifications in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🎮 CLI Command Directory

| Command | Action |
|---|---|
| `npm run agent:codex` | Execute Codex/no-API mode with autonomous crawling. |
| `npm run agent:api` | Execute Groq API tool loop mode. |
| `npm run agent:state` | Output the current page's accessible JSON state to disk. |
| `npm run test:smoke` | Run local framework integration tests. |
| `npm run typecheck` | Run type checking to verify codebase compile status. |
| `npm run quality:gate` | Execute full gate audit (Typecheck + Smoke + Security Scan + Report Sanity). |

---

## 🔧 Configuring Groq API Mode

Create a `.env.local` or `.env` file in the project root:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b
TEST_EMAIL=
TEST_PASSWORD=
HEADLESS=false
USE_PERSISTENT_PROFILE=false
```

Execute a fully autonomous run:
```bash
npm run agent:api -- --url "https://example.com" --task "Submit the contact form and verify success" --headed
```

---

## 🛡️ Safety Enforcement Model

The agent blocks destructive actions by default using a safe-tool whitelist and intent filtering:
* **Allowed**: Navigation, screenshots, local state capture, lead generation, form submission, pagination, and searching.
* **Blocked**: Deletes, archives, payment checkout, user invites, settings modifications, bulk updates, and real message sends.

To override, set safety permissions in your JSON task file:
```json
{
  "safety": {
    "allowDelete": true,
    "allowRealMessageSend": false
  }
}
```

---

## 🗃️ Output Reports & Artifacts

All outputs remain local and are excluded from version control:
* **Reports**: Excel workbooks (`agent/reports/*.xlsx`) include a clean user-facing `Bug Report` sheet with embedded screenshots, a `Summary` dashboard, and detailed technical evidence sheets.
* **Logs & Traces**: Playwright traces (`agent/artifacts/traces/`) and raw browser console/network logs.
* **State Snapshot**: Current accessible state tree is cached under `agent/artifacts/state/latest-browser-state.json`.

---

## 🔌 Installing as an Agent Plugin

Expose the `qa-agent` skill to your Codex or Claude Code terminal agent:

For **Codex**:
```bash
codex plugin marketplace add .
codex plugin add qa-agent@qa-agent-marketplace
```

For **Claude Code**:
```text
/plugin marketplace add https://github.com/BAKUGOS1/QaAgent
/plugin install qa-agent@qa-agent-marketplace
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
