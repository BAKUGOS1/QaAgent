import type { QaIssue, RunContext } from "../shared/types.js";

function issueList(title: string, issues: QaIssue[]): string {
  if (issues.length === 0) return `## ${title}\n\nNone found.\n`;
  return `## ${title}\n\n${issues.map((issue) => [
    `### ${issue.severity}: ${conciseText(issue.title)}`,
    `- Area: ${issue.area}`,
    `- Error/Bug: ${clearText(issue.description)}`,
    issue.evidence ? `- Evidence: ${clearText(issue.evidence)}` : undefined,
    issue.suggestedFix ? `- Fix: ${clearText(issue.suggestedFix)}` : undefined
  ].filter(Boolean).join("\n")).join("\n\n")}\n`;
}

function issueMatrix(context: RunContext): string {
  const rows = [...context.bugs, ...context.uxIssues, ...context.missingValidations].map((issue) => ({
    module: issue.area,
    issue: conciseText(issue.title),
    description: clearText(issue.description),
    priority: issue.severity,
    status: context.finalStatus === "Fail" ? "Blocked" : "Open"
  }));
  if (rows.length === 0) {
    if (context.coverage && context.finalStatus !== "Pass") {
      rows.push({
        module: "Coverage",
        issue: "Coverage incomplete",
        description: `${context.coverage.notes.join(" ")} Not tested: ${context.coverage.notTested}. Needs verification: ${context.coverage.needsVerification}. Blocked: ${context.coverage.blocked}.`,
        priority: context.coverage.blocked ? "High" : "Medium",
        status: context.coverage.blocked ? "Blocked" : "Needs Verification"
      });
      return [
        "| Module | Issue | Description | Priority | Status |",
        "|---|---|---|---|---|",
        ...rows.map((row) => `| ${escapeTable(row.module)} | ${escapeTable(row.issue)} | ${escapeTable(row.description)} | ${escapeTable(row.priority)} | ${escapeTable(row.status)} |`)
      ].join("\n");
    }
    rows.push({
      module: "Lead Module",
      issue: "No issue found",
      description: "No bugs were detected during this run.",
      priority: "Low",
      status: "Pass"
    });
  }
  return [
    "| Module | Issue | Description | Priority | Status |",
    "|---|---|---|---|---|",
    ...rows.map((row) => `| ${escapeTable(row.module)} | ${escapeTable(row.issue)} | ${escapeTable(row.description)} | ${escapeTable(row.priority)} | ${escapeTable(row.status)} |`)
  ].join("\n");
}

function coverageMatrix(context: RunContext): string {
  const rows = context.coverage?.items || [];
  if (!rows.length) return "No coverage summary generated.";
  return [
    "| Module | Actions Attempted | Evidence | Status | Confidence | Blocker |",
    "|---|---|---|---|---|---|",
    ...rows.map((row) => `| ${escapeTable(row.module)} | ${escapeTable(row.actionsAttempted)} | ${escapeTable(row.evidence)} | ${escapeTable(row.status)} | ${escapeTable(row.confidence)} | ${escapeTable(row.blocker || "")} |`)
  ].join("\n");
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function conciseText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clearText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function renderMarkdownReport(context: RunContext): string {
  return `# QA Agent Report

- Website URL: ${context.task.websiteUrl}
- Task: ${context.task.task}
- QA profile: ${context.task.qaProfile}
- Date/time: ${context.startedAt}
- Mode: ${context.mode}
- Browser mode: ${context.headed ? "headed" : "headless"}
- Login result: ${context.loginResult}
- Final QA status: ${context.finalStatus}
- Coverage confidence: ${context.coverage?.confidence || "Not generated"}
- Trace: ${context.tracePath || "No trace captured"}

## Steps Performed

${context.stepsPerformed.length ? context.stepsPerformed.map((step) => `- ${step}`).join("\n") : "No explicit steps were performed."}

## Test Data Created

${context.generatedLeads.length ? context.generatedLeads.map((lead) => `- ${lead.name}, ${lead.company}, ${lead.city}, ${lead.source}, ${lead.status}`).join("\n") : "No lead data generated."}

## Issue Matrix

${issueMatrix(context)}

## Coverage

${coverageMatrix(context)}

${context.coverage?.notes.length ? context.coverage.notes.map((note) => `- ${note}`).join("\n") : ""}

## Browser State

- Latest state JSON: agent/artifacts/state/latest-browser-state.json
- Clickable elements indexed: ${context.browserState?.clickableElements.length ?? 0}
- Forms detected: ${context.browserState?.forms.length ?? 0}
- Tables detected: ${context.browserState?.tables.length ?? 0}

## QA Checklist

${Object.keys(context.qaChecklist || {}).length ? Object.entries(context.qaChecklist || {}).map(([check, status]) => `- [${status}] ${check}`).join("\n") : "No checklist generated."}

${issueList("Bugs Found", context.bugs)}

## Console Errors

${context.consoleErrors.length ? context.consoleErrors.map((error) => `- ${clearText(error)}`).join("\n") : "None found."}

## Network Errors

${context.networkErrors.length ? context.networkErrors.map((error) => `- ${clearText(error)}`).join("\n") : "None found."}

${issueList("UI/UX Issues", context.uxIssues)}

${issueList("Missing Validations", context.missingValidations)}

## Screenshots

${context.screenshots.length ? context.screenshots.map((shot) => `- ${shot}`).join("\n") : "No screenshots captured."}

## Suggested Fixes For Developers

${[...context.bugs, ...context.uxIssues, ...context.missingValidations].map((issue) => `- [${issue.severity}] ${clearText(issue.suggestedFix || issue.title)}`).join("\n") || "- No fixes suggested."}
`;
}
