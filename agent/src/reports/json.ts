import type { RunContext } from "../shared/types.js";

export function renderJsonReport(context: RunContext): string {
  return `${JSON.stringify(context, null, 2)}\n`;
}
