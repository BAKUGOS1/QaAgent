# QA Agent Plugin Install Guide

This repository includes a Codex plugin so the QA Agent workflow can be installed from the repo on any machine.

## What The Plugin Adds

- A Codex skill named `qa-agent`.
- Safe website QA rules for Playwright runs.
- Guidance for credentials, screenshots, reports, console/network checks, responsive checks, and skipped risky actions.

The plugin does not store credentials and does not commit generated reports or screenshots.

## Install From A Fresh Clone

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

Add this repo as a Codex plugin marketplace:

```bash
codex plugin marketplace add .
```

Install the plugin:

```bash
codex plugin add qa-agent@qa-agent-marketplace
```

Open a new Codex thread after installing. New threads pick up newly installed plugins and skills.

## Install From An Absolute Path

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

## Repo Layout

```text
.agents/plugins/marketplace.json
plugins/qa-agent/.codex-plugin/plugin.json
plugins/qa-agent/skills/qa-agent/SKILL.md
```

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
