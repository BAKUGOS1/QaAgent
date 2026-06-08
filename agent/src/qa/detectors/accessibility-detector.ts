import type { BrowserState, QaIssue } from "../../shared/types.js";

export function detectAccessibilityIssues(state: BrowserState): QaIssue[] {
  const issues: QaIssue[] = [];

  // Check for clickable controls with no accessible name
  const unnamed = state.clickableElements.filter(
    (element) => !element.text && ["button", "link"].includes(element.role || "")
  );
  if (unnamed.length) {
    issues.push({
      title: "Clickable controls have no accessible name",
      severity: "Medium",
      area: "Accessibility",
      description: `${unnamed.length} visible clickable control(s) do not expose readable text or aria-label. Selectors: ${unnamed.slice(0, 5).map((e) => e.selector).join(", ")}`,
      suggestedFix: "Add accessible names with visible text or aria-label."
    });
  }

  // Check for inputs without associated labels
  const unlabeledInputs = state.inputs.filter((input) => {
    const lower = input.toLowerCase();
    return !lower.includes("email") && !lower.includes("password") &&
           !lower.includes("search") && !lower.includes("name") &&
           lower === "input" || lower === "textarea";
  });
  if (unlabeledInputs.length) {
    issues.push({
      title: "Form inputs missing labels or identifiers",
      severity: "Medium",
      area: "Accessibility",
      description: `${unlabeledInputs.length} input(s) lack name, placeholder, or aria-label attributes. Screen readers cannot identify these fields.`,
      suggestedFix: "Add <label>, aria-label, or placeholder to all form inputs."
    });
  }

  // Check for missing page heading structure
  const hasH1 = state.textSample.length > 0 && state.clickableElements.some(
    (el) => el.tag === "h1" || el.role === "heading"
  );
  // Check if page has enough content to expect a heading
  if (!hasH1 && state.textSample.length > 200 && state.buttons.length > 0) {
    issues.push({
      title: "Page may be missing heading structure",
      severity: "Low",
      area: "Accessibility",
      description: "No heading elements were detected among clickable/interactive elements. Pages should use proper heading hierarchy (h1, h2, h3) for screen readers and SEO.",
      suggestedFix: "Add semantic heading elements to structure page content."
    });
  }

  // Check for forms without a submit button
  for (const form of state.forms) {
    if (form.fieldCount > 0 && form.submitLabels.length === 0) {
      issues.push({
        title: "Form has no visible submit action",
        severity: "Medium",
        area: "Accessibility",
        description: `Form at "${form.selector}" has ${form.fieldCount} field(s) but no detected submit button. Users may not know how to submit.`,
        suggestedFix: "Add a clear submit button inside or associated with the form."
      });
    }
  }

  return issues;
}
