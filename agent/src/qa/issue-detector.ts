import type { BrowserState, QaIssue } from "../shared/types.js";
import { issuesFromConsoleErrors, issuesFromNetworkErrors } from "./checks.js";
import { detectMissingValidation } from "./validators.js";
import { detectBasicUxIssues } from "./ux-checker.js";
import { detectAccessibilityIssues } from "./detectors/accessibility-detector.js";
import { detectFormIssues } from "./detectors/form-detector.js";
import { detectTableIssues } from "./detectors/table-detector.js";
import { detectPerformanceIssues } from "./detectors/performance-detector.js";

export function detectIssues(state: BrowserState, consoleErrors: string[], networkErrors: string[]): {
  bugs: QaIssue[];
  uxIssues: QaIssue[];
  missingValidations: QaIssue[];
} {
  return {
    bugs: [
      ...issuesFromConsoleErrors(consoleErrors),
      ...issuesFromNetworkErrors(networkErrors),
      ...detectPerformanceIssues(state, networkErrors)
    ],
    uxIssues: [
      ...detectBasicUxIssues(state.buttons, state.inputs),
      ...detectAccessibilityIssues(state),
      ...detectTableIssues(state)
    ],
    missingValidations: [
      ...detectMissingValidation(state.textSample),
      ...detectFormIssues(state)
    ]
  };
}
