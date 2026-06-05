import type { QaPlaybook } from "./playbook-types.js";

export const securityBasicPlaybook: QaPlaybook = {
  id: "security-basic",
  name: "Security Basic",
  profiles: ["security-basic", "full-professional"],
  checks: [
    "Password not visible in page text/logs",
    "Protected route check",
    "No tokens printed in console",
    "No password stored in report/memory",
    "No sensitive export by default"
  ]
};

