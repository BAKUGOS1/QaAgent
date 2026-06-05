import type { BrowserState, QaIssue } from "../../shared/types.js";

export function detectFormIssues(state: BrowserState): QaIssue[] {
  if (state.forms.length || state.inputs.length) return [];
  return [{
    title: "No form fields detected",
    severity: "Low",
    area: "Forms",
    description: "The current page state did not expose visible form fields.",
    suggestedFix: "Confirm whether this page should contain a form."
  }];
}

