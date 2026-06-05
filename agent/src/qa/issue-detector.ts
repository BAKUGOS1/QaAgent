import type { BrowserState, QaIssue } from "../shared/types.js";
import { issuesFromConsoleErrors, issuesFromNetworkErrors } from "./checks.js";
import { detectMissingValidation } from "./validators.js";
import { detectBasicUxIssues } from "./ux-checker.js";

export function detectIssues(state: BrowserState, consoleErrors: string[], networkErrors: string[]): {
  bugs: QaIssue[];
  uxIssues: QaIssue[];
  missingValidations: QaIssue[];
} {
  return {
    bugs: [...issuesFromConsoleErrors(consoleErrors), ...issuesFromNetworkErrors(networkErrors)],
    uxIssues: detectBasicUxIssues(state.buttons, state.inputs),
    missingValidations: detectMissingValidation(state.textSample)
  };
}
