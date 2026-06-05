import type { QaPlaybook } from "./playbook-types.js";

export const tablePaginationPlaybook: QaPlaybook = {
  id: "table-pagination",
  name: "Table And Pagination",
  profiles: ["functional", "regression-basic", "full-professional"],
  checks: [
    "Next/previous pagination",
    "Page size",
    "Row count",
    "Loading state",
    "Empty state",
    "Horizontal scroll/mobile usability"
  ]
};

