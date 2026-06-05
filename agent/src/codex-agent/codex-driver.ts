import type { QaTask, RunContext } from "../shared/types.js";
import { BrowserAgent } from "../browser/browser-agent.js";
import { createRandomLeads } from "../data/lead-data.js";
import { detectIssues } from "../qa/issue-detector.js";
import type { WrittenReports } from "../reports/report-writer.js";
import { runExplicitTaskSteps } from "./codex-task-runner.js";
import { finalizeCodexReport } from "./codex-report-helper.js";

export async function runCodexDriver(task: QaTask, headed: boolean): Promise<{ context: RunContext; reports: WrittenReports }> {
  const browser = new BrowserAgent(headed);
  const generatedLeads = createRandomLeads(task.testDataCount);
  const startedAt = new Date().toISOString();
  const screenshots: string[] = [];

  try {
    await browser.start();
    await browser.openUrl(task.websiteUrl);
    await browser.waitForLoad();
    screenshots.push(await browser.screenshot("initial"));
    screenshots.push(...await runExplicitTaskSteps(browser, task));
    const state = await browser.getPageState();
    const detected = detectIssues(state, browser.getConsoleErrors(), browser.getNetworkErrors());
    const context: RunContext = {
      mode: "codex",
      headed,
      startedAt,
      task,
      generatedLeads,
      stepsPerformed: [
        `Created a structured Codex run plan for: ${task.task}`,
        `Opened ${task.websiteUrl}`,
        ...browser.recorder.all(),
        "Generated local CRM lead test data.",
        "Captured page state, console errors, network errors, and screenshots."
      ],
      bugs: detected.bugs,
      uxIssues: detected.uxIssues,
      missingValidations: detected.missingValidations,
      consoleErrors: browser.getConsoleErrors(),
      networkErrors: browser.getNetworkErrors(),
      screenshots,
      loginResult: task.credentials ? "Credentials configured; explicit login steps required in task file or Codex interaction." : "No credentials provided.",
      finalStatus: detected.bugs.length ? "Partial Pass" : "Pass"
    };
    return { context, reports: finalizeCodexReport(context) };
  } catch (error) {
    const context: RunContext = {
      mode: "codex",
      headed,
      startedAt,
      task,
      generatedLeads,
      stepsPerformed: browser.recorder.all(),
      bugs: [{
        title: "Codex run failed",
        severity: "High",
        area: "Agent runtime",
        description: error instanceof Error ? error.message : String(error),
        suggestedFix: "Inspect the task selectors, site availability, and safety guard settings."
      }],
      uxIssues: [],
      missingValidations: [],
      consoleErrors: browser.getConsoleErrors(),
      networkErrors: browser.getNetworkErrors(),
      screenshots,
      loginResult: "Not completed.",
      finalStatus: "Fail"
    };
    return { context, reports: finalizeCodexReport(context) };
  } finally {
    await browser.close();
  }
}
