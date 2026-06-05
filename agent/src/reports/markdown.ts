import type { QaIssue, RunContext } from "../shared/types.js";

function issueList(title: string, issues: QaIssue[]): string {
  if (issues.length === 0) return `## ${title}\n\nNone found.\n`;
  return `## ${title}\n\n${issues.map((issue) => [
    `### ${issue.severity}: ${issue.title}`,
    `- Area: ${issue.area}`,
    `- Description: ${issue.description}`,
    issue.evidence ? `- Evidence: ${issue.evidence}` : undefined,
    issue.suggestedFix ? `- Suggested fix: ${issue.suggestedFix}` : undefined
  ].filter(Boolean).join("\n")).join("\n\n")}\n`;
}

export function renderMarkdownReport(context: RunContext): string {
  return `# QA Agent Report

- Website URL: ${context.task.websiteUrl}
- Task: ${context.task.task}
- Date/time: ${context.startedAt}
- Mode: ${context.mode}
- Browser mode: ${context.headed ? "headed" : "headless"}
- Login result: ${context.loginResult}
- Final QA status: ${context.finalStatus}

## Steps Performed

${context.stepsPerformed.length ? context.stepsPerformed.map((step) => `- ${step}`).join("\n") : "No explicit steps were performed."}

## Test Data Created

${context.generatedLeads.length ? context.generatedLeads.map((lead) => `- ${lead.name}, ${lead.company}, ${lead.city}, ${lead.source}, ${lead.status}`).join("\n") : "No lead data generated."}

${issueList("Bugs Found", context.bugs)}

## Console Errors

${context.consoleErrors.length ? context.consoleErrors.map((error) => `- ${error}`).join("\n") : "None found."}

## Network Errors

${context.networkErrors.length ? context.networkErrors.map((error) => `- ${error}`).join("\n") : "None found."}

${issueList("UI/UX Issues", context.uxIssues)}

${issueList("Missing Validations", context.missingValidations)}

## Screenshots

${context.screenshots.length ? context.screenshots.map((shot) => `- ${shot}`).join("\n") : "No screenshots captured."}

## Suggested Fixes For Developers

${[...context.bugs, ...context.uxIssues, ...context.missingValidations].map((issue) => `- [${issue.severity}] ${issue.suggestedFix || issue.title}`).join("\n") || "- No fixes suggested."}
`;
}
