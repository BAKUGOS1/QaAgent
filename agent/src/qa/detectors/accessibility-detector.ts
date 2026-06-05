import type { BrowserState, QaIssue } from "../../shared/types.js";

export function detectAccessibilityIssues(state: BrowserState): QaIssue[] {
  const unnamed = state.clickableElements.filter((element) => !element.text && ["button", "link"].includes(element.role || ""));
  return unnamed.length ? [{
    title: "Clickable controls have no accessible name",
    severity: "Medium",
    area: "Accessibility",
    description: `${unnamed.length} visible clickable control(s) do not expose readable text or aria-label.`,
    suggestedFix: "Add accessible names with visible text or aria-label."
  }] : [];
}

