import type { QaPlaybook } from "./playbook-types.js";

export const errorStatesPlaybook: QaPlaybook = {
  id: "error-states",
  name: "Error States",
  profiles: ["functional", "regression-basic", "full-professional"],
  checks: [
    "Failed API request behavior",
    "Empty state",
    "Permission denied state",
    "Form submission failure",
    "Retry behavior"
  ]
};

