import type { QaPlaybook } from "./playbook-types.js";

export const smokePlaybook: QaPlaybook = {
  id: "smoke",
  name: "Smoke",
  profiles: ["smoke", "functional", "regression-basic", "full-professional"],
  checks: [
    "Page loads",
    "No blocker console errors",
    "No blocker network errors",
    "Primary navigation visible",
    "Screenshot captured"
  ]
};

