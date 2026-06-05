import type { Severity } from "../shared/types.js";

export function severityRank(severity: Severity): number {
  return { Critical: 4, High: 3, Medium: 2, Low: 1 }[severity];
}
