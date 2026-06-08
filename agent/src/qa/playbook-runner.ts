import type { BrowserState, QaProfile } from "../shared/types.js";
import { playbooksForProfile } from "./playbooks/index.js";
import type { BrowserAgent } from "../browser/browser-agent.js";

export async function runPlaybookChecks(
  profile: QaProfile,
  browser: BrowserAgent,
  state?: BrowserState
): Promise<Record<string, string>> {
  const checklist: Record<string, string> = {};
  const promises: Array<Promise<{ key: string; value: string }>> = [];

  for (const playbook of playbooksForProfile(profile)) {
    for (const check of playbook.checks) {
      const checkName = typeof check === "string" ? check : check.name;
      const key = `${playbook.name}: ${checkName}`;
      if (typeof check !== "string" && check.run) {
        const runFn = check.run;
        promises.push(
          (async () => {
            try {
              const res = await runFn(browser, state);
              const status = typeof res === "boolean" ? (res ? "Pass" : "Fail") : res;
              return { key, value: status };
            } catch (err: any) {
              return { key, value: `Error: ${err.message}` };
            }
          })()
        );
      } else {
        checklist[key] = inferStatus(checkName, state);
      }
    }
  }

  const results = await Promise.all(promises);
  for (const res of results) {
    checklist[res.key] = res.value;
  }

  return checklist;
}

export function buildQaChecklist(
  profile: QaProfile,
  state?: BrowserState,
  precomputedCheckResults?: Record<string, string>
): Record<string, string> {
  const checklist: Record<string, string> = {};
  for (const playbook of playbooksForProfile(profile)) {
    for (const check of playbook.checks) {
      const checkName = typeof check === "string" ? check : check.name;
      const key = `${playbook.name}: ${checkName}`;
      if (precomputedCheckResults && key in precomputedCheckResults) {
        checklist[key] = precomputedCheckResults[key];
      } else {
        checklist[key] = inferStatus(checkName, state);
      }
    }
  }
  return checklist;
}

function inferStatus(check: string, state?: BrowserState): string {
  if (!state) return "Planned";
  const lower = check.toLowerCase();
  if (lower.includes("page loads")) return state.title || state.url ? "Pass" : "Needs Verification";
  if (lower.includes("console")) return state.consoleErrors.length ? "Needs Review" : "Pass";
  if (lower.includes("network")) return state.networkErrors.length ? "Needs Review" : "Pass";
  if (lower.includes("navigation")) return state.links.length || state.buttons.length ? "Needs Verification" : "Not Detected";
  if (lower.includes("screenshot")) return state.screenshotPath ? "Pass" : "Needs Verification";
  return "Planned";
}

