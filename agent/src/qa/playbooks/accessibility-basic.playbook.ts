import type { QaPlaybook } from "./playbook-types.js";

export const accessibilityBasicPlaybook: QaPlaybook = {
  id: "accessibility-basic",
  name: "Accessibility Basic",
  profiles: ["accessibility-basic", "full-professional"],
  checks: [
    "Buttons have accessible names",
    "Inputs have labels/placeholders",
    "Keyboard tab flow basic check",
    "Focus visible",
    "Image alt text warning",
    "Modal focus behavior"
  ]
};

