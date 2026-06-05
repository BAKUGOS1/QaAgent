import type { QaPlaybook } from "./playbook-types.js";

export const performanceBasicPlaybook: QaPlaybook = {
  id: "performance-basic",
  name: "Performance Basic",
  profiles: ["performance-basic", "full-professional"],
  checks: [
    "Page load time",
    "Slow API calls",
    "Large asset warnings",
    "Repeated API calls",
    "UI freeze/loading behavior"
  ]
};

