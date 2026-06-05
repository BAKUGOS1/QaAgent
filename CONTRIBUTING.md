# Contributing

Thanks for improving QA Agent. Keep changes practical, testable, and safe for real websites.

## Local Setup

```bash
npm install
npx playwright install
npm run typecheck
npm run test:smoke
```

## Development Rules

- Keep browser automation safe by default.
- Do not commit `.env`, `.env.local`, reports, screenshots, traces, browser profiles, cookies, passwords, tokens, or real customer data.
- Prefer task JSON examples for reusable QA flows.
- Keep report text direct: issue, description, priority, and status should be clear enough for a product or QA team to act on.
- Preserve Codex/no-API mode when adding API-driven behavior.

## Pull Request Checklist

- Explain what changed and why.
- Include the commands used to verify the change.
- Add or update task examples when behavior changes.
- Confirm that destructive actions remain blocked unless a task explicitly allows them.
- Confirm generated artifacts are not committed.

## Recommended Checks

```bash
npm run typecheck
npm run test:smoke
```
