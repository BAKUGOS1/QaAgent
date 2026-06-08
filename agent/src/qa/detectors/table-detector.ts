import type { BrowserState, QaIssue } from "../../shared/types.js";

export function detectTableIssues(state: BrowserState): QaIssue[] {
  const issues: QaIssue[] = [];

  for (const table of state.tables) {
    // Empty tables without empty-state messaging
    if (table.rowCount === 0) {
      issues.push({
        title: "Table has no visible rows",
        severity: "Medium",
        area: "Tables",
        description: `Table/grid at "${table.selector}" has no detected rows. If this is expected (empty state), verify there is a clear empty-state message like "No records found."`,
        suggestedFix: "Add an empty-state message or illustration when no data is present."
      });
    }

    // Tables without column headers
    if (table.columnCount === 0 && table.rowCount > 0) {
      issues.push({
        title: "Table has rows but no column headers",
        severity: "Medium",
        area: "Tables",
        description: `Table at "${table.selector}" has ${table.rowCount} rows but no detected <th> or [role='columnheader'] elements.`,
        suggestedFix: "Add proper <th> elements with scope attributes for accessibility."
      });
    }

    // Tables with data but very few headers relative to implied columns
    if (table.headers.length > 0 && table.headers.length >= 8) {
      issues.push({
        title: "Table has many columns — check horizontal scroll/responsiveness",
        severity: "Low",
        area: "Tables",
        description: `Table at "${table.selector}" has ${table.headers.length} columns: ${table.headers.slice(0, 8).join(", ")}${table.headers.length > 8 ? "..." : ""}. On small screens this may overflow.`,
        suggestedFix: "Consider horizontal scroll, column hiding, or responsive layout for wide tables."
      });
    }

    // Large tables without pagination signals
    if (table.rowCount > 20) {
      // Check if there's any pagination text/buttons on the page
      const paginationSignals = state.buttons.some((btn) =>
        /next|prev|page|1|2|3|›|»|previous/i.test(btn)
      ) || state.textSample.toLowerCase().includes("page") ||
        state.textSample.toLowerCase().includes("showing");

      if (!paginationSignals) {
        issues.push({
          title: "Large table may lack pagination",
          severity: "Medium",
          area: "Tables",
          description: `Table at "${table.selector}" has ${table.rowCount} rows and no detected pagination controls. Large datasets without pagination degrade performance and usability.`,
          suggestedFix: "Add pagination, virtual scrolling, or a 'Load more' mechanism."
        });
      }
    }
  }

  return issues;
}
