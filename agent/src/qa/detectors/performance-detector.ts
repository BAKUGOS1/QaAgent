import type { BrowserState, QaIssue } from "../../shared/types.js";

export function detectPerformanceIssues(state: BrowserState, networkErrors: string[]): QaIssue[] {
  const issues: QaIssue[] = [];

  // Many failed network requests
  if (networkErrors.length > 10) {
    issues.push({
      title: "Many failed network requests",
      severity: "Medium",
      area: "Performance",
      description: `${networkErrors.length} failed network requests were captured during the run. This can slow page load, cause missing data, and degrade user experience.`,
      suggestedFix: "Review repeated failed calls, check API availability, and add proper error handling/retry logic."
    });
  }

  // High clickable element count suggests heavy DOM
  if (state.clickableElements.length >= 100) {
    issues.push({
      title: "Page has a high number of interactive elements",
      severity: "Low",
      area: "Performance",
      description: `${state.clickableElements.length} clickable elements were indexed (capped at 100). Heavy DOM with many interactive elements can slow rendering and event handling.`,
      suggestedFix: "Consider lazy rendering, virtual scrolling, or splitting the page into smaller views."
    });
  }

  // Many visible forms on one page
  if (state.forms.length > 5) {
    issues.push({
      title: "Page contains many visible forms",
      severity: "Low",
      area: "Performance",
      description: `${state.forms.length} forms detected on a single page. Multiple complex forms can impact page weight and load time.`,
      suggestedFix: "Consider progressive disclosure or multi-step form patterns."
    });
  }

  // Check for excessive error messages suggesting broken state
  if (state.errorMessages.length > 5) {
    issues.push({
      title: "Multiple error messages visible on page",
      severity: "High",
      area: "Reliability",
      description: `${state.errorMessages.length} visible error/alert messages detected: ${state.errorMessages.slice(0, 3).join(" | ")}`,
      suggestedFix: "Investigate root causes of multiple simultaneous errors."
    });
  }

  // Console errors count
  if (state.consoleErrors.length > 5) {
    issues.push({
      title: "High console error volume",
      severity: "Medium",
      area: "Performance",
      description: `${state.consoleErrors.length} console errors detected. Excessive JS errors can degrade performance and indicate broken functionality.`,
      suggestedFix: "Fix JS errors starting with the most frequently repeated ones."
    });
  }

  return issues;
}
