import type { BrowserState, QaIssue, QaProfile } from "../shared/types.js";
import { detectIssues } from "./issue-detector.js";
import { buildQaChecklist } from "./playbook-runner.js";

export interface QaEngineResult {
  bugs: QaIssue[];
  uxIssues: QaIssue[];
  missingValidations: QaIssue[];
  checklist: Record<string, string>;
}

export function runQaEngine(
  profile: QaProfile,
  state: BrowserState,
  consoleErrors: string[],
  networkErrors: string[]
): QaEngineResult {
  const detected = detectIssues(state, consoleErrors, networkErrors);
  return {
    ...detected,
    checklist: buildQaChecklist(profile, state)
  };
}

