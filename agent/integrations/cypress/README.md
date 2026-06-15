# Cypress-Inspired Reliability Layer

QaAgent remains TypeScript + Playwright. It does not add Cypress as a runtime dependency. This integration adopts the Cypress ideas that fit a local-first QA agent:

- Retry query/assertion steps until a timeout, instead of relying on fixed sleeps.
- Keep mutating actions single-shot while still letting Playwright wait for actionability.
- Capture a failure screenshot when an assertion or command fails.
- Record every explicit task command in a structured Command Log with status, attempts, duration, error, and failure screenshot path.
- Support fixture references for reusable non-sensitive test values.
- Keep task steps independent so a later run does not depend on browser state from a previous run.

## Task Config

```json
{
  "cypress": {
    "defaultCommandTimeoutMs": 5000,
    "pollIntervalMs": 100,
    "screenshotOnFailure": true,
    "fixtureDir": "agent/fixtures"
  }
}
```

## Assertion Steps

```json
[
  { "action": "assert_visible", "selector": "h1" },
  { "action": "assert_text", "selector": "main", "expected": "Dashboard" },
  { "action": "assert_url_includes", "expected": "/dashboard" },
  { "action": "assert_count", "selector": "table tbody tr", "count": 10 }
]
```

Assertions re-query the page until they pass or hit `defaultCommandTimeoutMs`. Use `timeoutMs` on a step to override the task default.

## Fixtures

Fixtures live in `agent/fixtures` by default and must contain fake or non-sensitive values only.

```json
{ "action": "fill_by_label", "text": "Email", "fixture": "example-user.email" }
```

The fixture reference above loads `agent/fixtures/example-user.json` and reads the `email` key. Passwords, tokens, cookies, customer records, and payment data must not be stored in fixtures.

## Reports

Markdown and Excel reports include a `Cypress-Style Command Log`. This makes flaky UI failures easier to debug because each command shows:

- pass/fail status
- command kind
- command target
- retry attempts
- duration
- error text
- failure screenshot path
