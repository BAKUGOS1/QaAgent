import type { QaTask, RunContext } from "../shared/types.js";
import { BrowserAgent } from "../browser/browser-agent.js";
import { runConfiguredLogin } from "../browser/login-runner.js";
import { createRandomLeads } from "../data/lead-data.js";
import { buildCoverageSummary, statusWithCoverage } from "../qa/coverage.js";
import { runQaEngine } from "../qa/qa-engine.js";
import type { WrittenReports } from "../reports/report-writer.js";
import { runExplicitTaskSteps } from "./codex-task-runner.js";
import { finalizeCodexReport } from "./codex-report-helper.js";
import { runAutonomousExplorer } from "./autonomous-explorer.js";

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

    // Run autonomous explorer to discover and test more pages
    const explorerResult = await runAutonomousExplorer(browser, {
      maxPages: task.qaProfile === "smoke" ? 3 : 8,
      maxDepth: task.qaProfile === "smoke" ? 1 : 2,
      safety: task.safety,
      scope: task.scope
    });
    screenshots.push(...explorerResult.screenshots);

    const state = await browser.saveBrowserState(screenshots.at(-1));
    const detected = runQaEngine(task.qaProfile, state, browser.getConsoleErrors(), browser.getNetworkErrors(), task.scope);

    // Merge explorer-discovered issues with detector-found issues
    const allBugs = [...detected.bugs, ...explorerResult.bugs];
    const allUxIssues = [...detected.uxIssues, ...explorerResult.uxIssues];
    const allMissingValidations = [...detected.missingValidations, ...explorerResult.missingValidations];

    // Deduplicate issues by title+area
    const deduplicateIssues = (issues: typeof allBugs) => {
      const seen = new Set<string>();
      return issues.filter((issue) => {
        const key = `${issue.area}::${issue.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const tracePath = await browser.saveTrace();
    const stepsPerformed = [
      `Created a structured Codex run plan for: ${task.task}`,
      `Opened ${task.websiteUrl}`,
      ...browser.recorder.all(),
      ...explorerResult.stepsPerformed,
      `Explored ${explorerResult.pagesVisited.length} page(s) autonomously.`,
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
    const dedupedBugs = deduplicateIssues(allBugs);
    const dedupedUx = deduplicateIssues(allUxIssues);
    const dedupedValidations = deduplicateIssues(allMissingValidations);
    const finalStatus = statusWithCoverage(
      dedupedBugs.length + dedupedUx.length + dedupedValidations.length > 0,
      coverage
    );
    const context: RunContext = {
      mode: "codex",
      headed,
      startedAt,
      task,
      generatedLeads,
      stepsPerformed,
      bugs: dedupedBugs,
      uxIssues: dedupedUx,
      missingValidations: dedupedValidations,
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
        `Pages explored: ${explorerResult.pagesVisited.length}`,
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
