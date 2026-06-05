import type { QaPlaybook } from "./playbook-types.js";

export const formsPlaybook: QaPlaybook = {
  id: "forms",
  name: "Forms",
  profiles: ["functional", "regression-basic", "full-professional"],
  checks: [
    "Required fields",
    "Invalid email/phone",
    "Save loading state",
    "Success toast",
    "Error toast",
    "Cancel/back behavior",
    "Data persists after save"
  ]
};

