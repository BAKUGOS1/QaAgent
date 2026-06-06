# ECC Inspiration Notes

Source inspected: https://github.com/affaan-m/ECC

QaAgent does not install ECC or depend on it. Useful ideas were adapted into this TypeScript + Playwright repo:

- Quality gate before push: typecheck, smoke, audit, secret scan, report sanity.
- Security-first workflow: no hardcoded secrets, no password/report leakage, env-only credentials.
- E2E runner mindset: risk-based user journeys, screenshots, traces/artifacts, flaky-test quarantine.
- External action boundaries: read/test safely by default; require explicit permission for destructive or third-party side effects.
- Agent guide discipline: clear AGENTS.md, commands, done criteria, and memory rules.

## Adopted Commands

```bash
npm run quality:gate
npm run typecheck
npm run test:smoke
```

## What Was Skipped

- ECC installer/plugin system.
- Multi-harness configs unrelated to QaAgent.
- Agent Browser dependency, because QaAgent already uses Playwright and indexed browser state.
- Heavy hook systems, because this repo keeps checks as explicit scripts.

