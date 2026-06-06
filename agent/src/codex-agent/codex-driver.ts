import type { QaTask, RunContext } from "../shared/types.js";
import { BrowserAgent } from "../browser/browser-agent.js";
import { runConfiguredLogin } from "../browser/login-runner.js";
import { createRandomLeads } from "../data/lead-data.js";
import { buildCoverageSummary, statusWithCoverage } from "../qa/coverage.js";
import { runQaEngine } from "../qa/qa-engine.js";
import type { WrittenReports } from "../reports/report-writer.js";
import { runExplicitTaskSteps } from "./codex-task-runner.js";
import { finalizeCodexReport } from "./codex-report-helper.js";

export async function runCodexDriver(task: QaTask, headed: boolean): Promise<{ context: RunContext; reports: WrittenReports }> {
  const browser = new BrowserAgent(headed);
  const generatedLeads = createRandomLeads(task.testDataCount);
  const startedAt = new Date().toISOString();
  const screenshots: string[] = [];
  let loginResult = task.credentials ? "Credentials configured but login is not enabled." : "No credentials provided.";

  try {
    await browser.start();
    await browser.openUrl(task.websiteUrl);
    await browser.waitForLoad();
    screenshots.push(await browser.screenshot("initial"));
    const configuredLogin = await runConfiguredLogin(browser, task, screenshots);
    loginResult = configuredLogin.resultText;
    screenshots.push(...await runExplicitTaskSteps(browser, task));
    const state = await browser.saveBrowserState(screenshots.at(-1));
    const detected = runQaEngine(task.qaProfile, state, browser.getConsoleErrors(), browser.getNetworkErrors(), task.scope);
    const tracePath = await browser.saveTrace();
    const stepsPerformed = [
      `Created a structured Codex run plan for: ${task.task}`,
      `Opened ${task.websiteUrl}`,
      ...browser.recorder.all(),
      "Generated local CRM lead test data.",
      "Captured page state, console errors, network errors, screenshots, and coverage signals."
    ];
    const coverage = buildCoverageSummary({
      task,
      state,
      screenshots,
      stepsPerformed,
      loginResult
    });
    const finalStatus = statusWithCoverage(
      detected.bugs.length + detected.uxIssues.length + detected.missingValidations.length > 0,
      coverage
    );
    const context: RunContext = {
      mode: "codex",
      headed,
      startedAt,
      task,
      generatedLeads,
      stepsPerformed,
      bugs: detected.bugs,
      uxIssues: detected.uxIssues,
      missingValidations: detected.missingValidations,
      consoleErrors: browser.getConsoleErrors(),
      networkErrors: browser.getNetworkErrors(),
      screenshots,
      tracePath,
      browserState: state,
      coverage,
      qaChecklist: detected.checklist,
      memoryNotes: [
        `QA profile: ${task.qaProfile}`,
        `Risk tier: ${detected.riskTier}`,
        `Coverage confidence: ${coverage.confidence}`,
        `Clickable elements indexed: ${state.clickableElements.length}`,
        ...(tracePath ? [`Trace: ${tracePath}`] : []),
        "Use agent/artifacts/state/latest-browser-state.json for selector planning.",
        ...coverage.notes,
        ...detected.guidanceNotes
      ],
      loginResult,
      finalStatus
    };
    return { context, reports: finalizeCodexReport(context) };
  } catch (error) {
    const tracePath = await browser.saveTrace().catch(() => undefined);
    const stepsPerformed = browser.recorder.all();
    const coverage = buildCoverageSummary({
      task,
      screenshots,
      stepsPerformed,
      loginResult
    });
    const context: RunContext = {
      mode: "codex",
      headed,
      startedAt,
      task,
      generatedLeads,
      stepsPerformed,
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
      tracePath,
      coverage,
      qaChecklist: {},
      memoryNotes: [...coverage.notes, ...(tracePath ? [`Trace: ${tracePath}`] : [])],
      loginResult,
      finalStatus: "Fail"
    };
    return { context, reports: finalizeCodexReport(context) };
  } finally {
    await browser.close();
  }
}
