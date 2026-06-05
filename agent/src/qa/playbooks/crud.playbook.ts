import type { QaPlaybook } from "./playbook-types.js";

export const crudPlaybook: QaPlaybook = {
  id: "crud",
  name: "CRUD",
  profiles: ["functional", "regression-basic", "full-professional"],
  checks: [
    "Add test record",
    "View created record",
    "Edit test-created record",
    "Delete/archive only if explicitly allowed",
    "Duplicate prevention",
    "Empty state"
  ]
};

