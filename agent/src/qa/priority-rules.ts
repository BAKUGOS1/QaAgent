import type { Severity } from "../shared/types.js";

export const priorityRules: Record<Severity, string[]> = {
  Critical: [
    "Main business flow blocked",
    "Login completely broken",
    "Data loss or app crash",
    "Security-sensitive data exposed"
  ],
  High: [
    "Major feature broken",
    "Create/save/update fails",
    "Wrong data saved",
    "Important API failure blocks module"
  ],
  Medium: [
    "Validation missing",
    "Wrong error message",
    "Search/filter/table issue",
    "Mobile layout affects normal use"
  ],
  Low: [
    "Minor alignment or copy issue",
    "Non-blocking UX improvement",
    "Optional helper text missing"
  ]
};

