import type { BrowserState, QaProfile } from "../shared/types.js";
import { playbooksForProfile } from "./playbooks/index.js";

export function buildQaChecklist(profile: QaProfile, state?: BrowserState): Record<string, string> {
  const checklist: Record<string, string> = {};
  for (const playbook of playbooksForProfile(profile)) {
    for (const check of playbook.checks) {
      checklist[`${playbook.name}: ${check}`] = inferStatus(check, state);
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

