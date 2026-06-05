import type { QaPlaybook } from "./playbook-types.js";

export const navigationPlaybook: QaPlaybook = {
  id: "navigation",
  name: "Navigation",
  profiles: ["smoke", "functional", "ui-ux", "regression-basic", "full-professional"],
  checks: [
    "Sidebar/header links",
    "Active menu state",
    "Breadcrumbs when available",
    "Direct URL reload",
    "404/error page",
    "Back button behavior"
  ]
};

