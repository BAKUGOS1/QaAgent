import type { QaPlaybook } from "./playbook-types.js";

export const authPlaybook: QaPlaybook = {
  id: "auth",
  name: "Authentication",
  profiles: ["functional", "regression-basic", "security-basic", "full-professional"],
  checks: [
    "Valid login",
    "Invalid login",
    "Empty credential validation",
    "Logout when available",
    "Protected route behavior",
    "Session persistence"
  ]
};

