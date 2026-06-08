import type { BrowserState, QaIssue } from "../../shared/types.js";

export function detectFormIssues(state: BrowserState): QaIssue[] {
  const issues: QaIssue[] = [];

  // Check for forms with many fields but no clear required indicators
  for (const form of state.forms) {
    if (form.fieldCount >= 3 && form.submitLabels.length > 0) {
      // Forms with several fields likely need validation
      issues.push({
        title: "Form may lack visible required field indicators",
        severity: "Low",
        area: "Forms",
        description: `Form at "${form.selector}" has ${form.fieldCount} fields. Verify required fields are marked with asterisks, aria-required, or "required" attributes.`,
        suggestedFix: "Mark required fields with visual indicators and the required or aria-required attribute."
      });
    }
  }

  // Check for password-type inputs without autocomplete
  const passwordInputs = state.inputs.filter((input) =>
    input.toLowerCase().includes("password")
  );
  for (const pwd of passwordInputs) {
    issues.push({
      title: "Password field may lack autocomplete attribute",
      severity: "Low",
      area: "Forms",
      description: `Password input "${pwd}" should specify autocomplete="current-password" or "new-password" to help password managers and browsers.`,
      suggestedFix: "Add autocomplete='current-password' or 'new-password' to password inputs."
    });
  }

  // Check for email-type inputs without autocomplete
  const emailInputs = state.inputs.filter((input) =>
    input.toLowerCase().includes("email")
  );
  for (const email of emailInputs) {
    issues.push({
      title: "Email field may lack autocomplete attribute",
      severity: "Low",
      area: "Forms",
      description: `Email input "${email}" should specify autocomplete="email" to improve form completion experience.`,
      suggestedFix: "Add autocomplete='email' to email inputs."
    });
  }

  // Check for forms without a visible submit action
  for (const form of state.forms) {
    if (form.fieldCount > 0 && form.submitLabels.length === 0) {
      issues.push({
        title: "Form has fields but no visible submit action",
        severity: "Medium",
        area: "Forms",
        description: `Form at "${form.selector}" has ${form.fieldCount} input(s) but no detected button or submit action.`,
        suggestedFix: "Add a clear submit button associated with the form."
      });
    }
  }

  // Check for duplicate submit buttons in a form
  for (const form of state.forms) {
    if (form.submitLabels.length > 2) {
      issues.push({
        title: "Form has many submit-like buttons",
        severity: "Low",
        area: "Forms",
        description: `Form at "${form.selector}" has ${form.submitLabels.length} submit-like buttons: ${form.submitLabels.join(", ")}. This may confuse users about the primary action.`,
        suggestedFix: "Ensure one primary submit action is visually distinct."
      });
    }
  }

  return issues;
}
