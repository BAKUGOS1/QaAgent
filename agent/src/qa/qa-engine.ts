import type { BrowserState, QaIssue, QaProfile } from "../shared/types.js";
import { detectIssues } from "./issue-detector.js";
import { buildQaChecklist } from "./playbook-runner.js";
import { riskForScope, type RiskTier } from "./risk-rules.js";
import { flakyRules } from "./flaky-rules.js";

export interface QaEngineResult {
  bugs: QaIssue[];
  uxIssues: QaIssue[];
  missingValidations: QaIssue[];
  checklist: Record<string, string>;
  riskTier: RiskTier;
  guidanceNotes: string[];
}

export function runQaEngine(
  profile: QaProfile,
  state: BrowserState,
  consoleErrors: string[],
  networkErrors: string[],
  scope: string[] = [],
  precomputedChecklist?: Record<string, string>
): QaEngineResult {
  const detected = detectIssues(state, consoleErrors, networkErrors);
  const riskTier = riskForScope(scope);
  return {
    ...detected,
    checklist: {
      ...buildQaChecklist(profile, state, precomputedChecklist),
      "Risk tier assigned": riskTier,
      "Flaky mitigation rule loaded": flakyRules[0].mitigation
    },
    riskTier,
    guidanceNotes: [
      `Risk tier: ${riskTier}`,
      "Prioritize high-risk journeys before UI polish.",
      "Quarantine flaky flows only after preserving screenshot/state evidence."
    ]
  };
}
