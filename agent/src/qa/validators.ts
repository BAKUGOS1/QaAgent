import type { QaIssue } from "../shared/types.js";

export function detectMissingValidation(pageText: string): QaIssue[] {
  const issues: QaIssue[] = [];
  if (!/required|invalid|error|validation/i.test(pageText)) {
    issues.push({
      title: "No visible validation messaging detected",
      severity: "Low",
      area: "Forms",
      description: "The visible page text did not include common validation or error messaging.",
      suggestedFix: "Confirm required fields show clear inline validation and actionable error messages."
    });
  }
  return issues;
}
