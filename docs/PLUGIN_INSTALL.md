# QA Agent Plugin Install Guide

This repository includes Codex and Claude Code plugin surfaces so the QA Agent workflow can be installed from the repo on another machine.

## What The Plugin Adds

- A shared skill named `qa-agent`.
- A Codex plugin manifest.
- A Claude Code plugin manifest and `/qa-agent` command.
- Safe website QA rules for Playwright runs.
- Guidance for credentials, screenshots, traces, coverage truth, reports, console/network checks, responsive checks, and skipped risky actions.

The plugin does not store credentials and does not commit generated reports or screenshots.

## Install Dependencies From A Fresh Clone

Clone the repo:

```bash
git clone https://github.com/BAKUGOS1/QaAgent.git
cd QaAgent
```

Install project dependencies:

```bash
npm install
npx playwright install
npm run typecheck
npm run test:smoke
```

## Install In Codex

Add this repo as a Codex plugin marketplace:

```bash
codex plugin marketplace add .
```

Install the plugin:

```bash
codex plugin add qa-agent@qa-agent-marketplace
```

Open a new Codex thread after installing. New threads pick up newly installed plugins and skills.

### Codex Install From An Absolute Path

If you are not inside the repo:

```bash
codex plugin marketplace add "C:\path\to\QaAgent"
codex plugin add qa-agent@qa-agent-marketplace
```

## Update After Pulling Changes

After pulling plugin updates:

```bash
git pull
codex plugin add qa-agent@qa-agent-marketplace
```

Then open a new Codex thread.

## Install In Claude Code

From Claude Code, add the GitHub repo as a plugin marketplace:

```text
/plugin marketplace add https://github.com/BAKUGOS1/QaAgent
```

Then install the plugin:

```text
/plugin install qa-agent@qa-agent-marketplace
```

After install, open a new Claude Code session and use the included `/qa-agent` command or ask Claude to use the `qa-agent` skill.

For a local checkout instead of GitHub, add the absolute repo path:

```text
/plugin marketplace add C:\path\to\QaAgent
/plugin install qa-agent@qa-agent-marketplace
```

## Antigravity And Other Agent Hosts

For hosts that do not support this plugin marketplace format yet, use the repo directly:

```bash
git clone https://github.com/BAKUGOS1/QaAgent.git
cd QaAgent
npm install
npx playwright install
npm run quality:gate
```

Then tell the host agent:

```text
Read AGENTS.md and plugins/qa-agent/skills/qa-agent/SKILL.md. Use npm run agent:codex for safe local QA, keep secrets in env refs, and report coverage/status honestly.
```

This keeps the same QA behavior even when the host does not have native plugin marketplace support.

## Repo Layout

```text
.agents/plugins/marketplace.json
plugins/qa-agent/.codex-plugin/plugin.json
plugins/qa-agent/.claude-plugin/plugin.json
plugins/qa-agent/commands/qa-agent.md
plugins/qa-agent/skills/qa-agent/SKILL.md
```

## Current Verification Status

Verified locally:

- `npm run quality:gate`
- Codex plugin manifest validation for `plugins/qa-agent`

Needs clean-machine/manual host verification:

- `codex plugin marketplace add .`
- `codex plugin add qa-agent@qa-agent-marketplace`
- `/plugin marketplace add https://github.com/BAKUGOS1/QaAgent`
- `/plugin install qa-agent@qa-agent-marketplace`

The local machine previously blocked the Codex executable with `Access is denied`, so the repo keeps the exact host install commands documented for verification on a clean machine.

## Use It

Example prompts after install:

```text
Run full QA on https://example.com and generate a report.
Check login and every safe module with these demo credentials.
Capture screenshots, console errors, network errors, responsive issues, and accessibility findings.
```

## Safety Defaults

The QA Agent skill skips risky actions by default:

- delete
- archive
- payment
- mark paid
- send email/SMS/WhatsApp
- invite users
- export or download sensitive data
- bulk update
- settings changes
- danger zone
- logout

Forms and modals can be inspected, but they should not be submitted unless the user explicitly allows test data creation.
