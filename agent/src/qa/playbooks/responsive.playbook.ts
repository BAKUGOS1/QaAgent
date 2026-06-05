import type { QaPlaybook } from "./playbook-types.js";

export const responsivePlaybook: QaPlaybook = {
  id: "responsive",
  name: "Responsive",
  profiles: ["ui-ux", "regression-basic", "full-professional"],
  checks: [
    "Desktop viewport",
    "Tablet viewport",
    "Mobile viewport",
    "No horizontal overflow",
    "Buttons visible",
    "Forms usable",
    "Tables usable"
  ]
};

