import type { QaPlaybook } from "./playbook-types.js";

export const searchFilterSortPlaybook: QaPlaybook = {
  id: "search-filter-sort",
  name: "Search, Filter, Sort",
  profiles: ["functional", "regression-basic", "full-professional"],
  checks: [
    "Search by generated name/email/phone",
    "Filter by status/source/date when available",
    "Sort table columns",
    "Reset filters",
    "No result state"
  ]
};

