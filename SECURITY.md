# Security Policy

QA Agent is designed to run local browser automation against websites and CRM-style flows. Treat it like a testing tool with access to browser sessions, screenshots, page text, and local reports.

## Sensitive Data Rules

Do not commit:

- `.env` or `.env.local`
- API keys, passwords, cookies, or auth tokens
- Real customer data
- Payment data
- Sensitive exports
- Generated reports, screenshots, logs, traces, or browser profiles

Use environment variable references such as `TEST_EMAIL` and `TEST_PASSWORD` in task files instead of hardcoded credentials.

## Safe Testing Defaults

The safety guard blocks destructive and high-risk actions by default, including deletes, payments, real message sends, bulk updates, settings changes, billing changes, invites, and sensitive exports.

## Reporting A Security Issue

Open a private security advisory on GitHub if available, or contact the repository owner directly. Include:

- affected command or flow
- expected safe behavior
- observed unsafe behavior
- reproduction steps that do not expose secrets or real customer data
