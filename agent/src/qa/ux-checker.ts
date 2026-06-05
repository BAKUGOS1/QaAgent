import type { QaIssue } from "../shared/types.js";

export function detectBasicUxIssues(buttons: string[], inputs: string[]): QaIssue[] {
  const issues: QaIssue[] = [];
  if (buttons.length === 0) {
    issues.push({
      title: "No visible buttons detected",
      severity: "Low",
      area: "UI",
      description: "The page snapshot did not expose visible button labels.",
      suggestedFix: "Check whether primary actions are discoverable and accessible."
    });
  }
  if (inputs.length > 0 && buttons.length === 0) {
    issues.push({
      title: "Inputs present without obvious submit action",
      severity: "Medium",
      area: "Forms",
      description: "Visible inputs were found, but no button-like action was detected.",
      suggestedFix: "Add or label the primary form action clearly."
    });
  }
  return issues;
}
