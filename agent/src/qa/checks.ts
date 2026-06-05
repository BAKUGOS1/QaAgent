import type { QaIssue } from "../shared/types.js";

export function issuesFromConsoleErrors(errors: string[]): QaIssue[] {
  return errors.map((error) => ({
    title: "Console error detected",
    severity: "Medium",
    area: "Frontend runtime",
    description: error,
    suggestedFix: "Inspect stack trace and fix the failing frontend script or request handling."
  }));
}

export function issuesFromNetworkErrors(errors: string[]): QaIssue[] {
  return errors.map((error) => ({
    title: "Network request failed",
    severity: "High",
    area: "Network/API",
    description: error,
    suggestedFix: "Verify endpoint availability, request payload, auth, CORS, and server response."
  }));
}
