# Optional Future Adapter Plan

Browser-use is not mandatory in v1.

Future adapter path:

1. Keep the current TypeScript + Playwright engine as the source of truth.
2. Export `latest-browser-state.json` in a stable schema.
3. Add an optional adapter that can translate QaAgent state/actions into browser-use-compatible tasks.
4. Keep credentials, memory, screenshots, and reports local to QaAgent.
5. Do not migrate the repo to Python.

