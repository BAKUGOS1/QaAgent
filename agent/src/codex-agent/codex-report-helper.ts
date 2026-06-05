import type { RunContext } from "../shared/types.js";
import { writeReports } from "../reports/report-writer.js";
import { sitesMemory } from "../memory/sites-memory.js";
import { testHistory } from "../memory/test-history.js";

export function finalizeCodexReport(context: RunContext) {
  const reports = writeReports(context);
  const sites = sitesMemory.read();
  sites[context.task.websiteUrl] = {
    ...(sites[context.task.websiteUrl] || {}),
    lastRunSummary: `${context.finalStatus}: ${context.bugs.length} bugs, ${context.uxIssues.length} UX issues`,
    previousBugs: context.bugs.map((bug) => bug.title)
  };
  sitesMemory.write(sites);

  const history = testHistory.read();
  history.push({
    websiteUrl: context.task.websiteUrl,
    mode: context.mode,
    date: context.startedAt,
    status: context.finalStatus,
    reportMarkdown: reports.markdownPath,
    reportJson: reports.jsonPath
  });
  testHistory.write(history);
  return reports;
}
