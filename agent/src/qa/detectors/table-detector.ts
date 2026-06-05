import type { BrowserState, QaIssue } from "../../shared/types.js";

export function detectTableIssues(state: BrowserState): QaIssue[] {
  const emptyTables = state.tables.filter((table) => table.rowCount === 0);
  return emptyTables.length ? [{
    title: "Table has no visible rows",
    severity: "Medium",
    area: "Tables",
    description: `${emptyTables.length} visible table/grid element(s) have no detected rows.`,
    suggestedFix: "Check empty/loading state and row rendering."
  }] : [];
}

