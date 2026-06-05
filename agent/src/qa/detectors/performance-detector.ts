import type { QaIssue } from "../../shared/types.js";

export function detectPerformanceIssues(networkErrors: string[]): QaIssue[] {
  const repeatedErrors = networkErrors.length > 10;
  return repeatedErrors ? [{
    title: "Many failed network requests",
    severity: "Medium",
    area: "Performance",
    description: `${networkErrors.length} failed network requests were captured during the run.`,
    suggestedFix: "Review repeated failed calls and loading behavior."
  }] : [];
}

