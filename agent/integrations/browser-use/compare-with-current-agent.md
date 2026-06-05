# Browser-Use Compared With QaAgent

| Area | Browser-use | QaAgent |
|---|---|---|
| Language | Python | TypeScript |
| Browser engine | Browser automation agent | Playwright |
| State | Agent browser state | `agent/artifacts/state/latest-browser-state.json` |
| Click actions | Indexed CLI actions | `click_by_index`, text, role, selector |
| Reports | Task oriented | Markdown, JSON, Excel with screenshots |
| Modes | LLM agent library | Codex/no-API and Groq/API |
| Memory | Agent memory concepts | Local JSON memory, no secrets |

QaAgent borrows the useful architecture ideas without making browser-use a dependency.

