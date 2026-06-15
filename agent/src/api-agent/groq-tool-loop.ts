import type { AppConfig } from "../config.js";
import { BrowserAgent } from "../browser/browser-agent.js";
import { runConfiguredLogin } from "../browser/login-runner.js";
import { createRandomLeads } from "../data/lead-data.js";
import { buildCoverageSummary, statusWithCoverage } from "../qa/coverage.js";
import { runQaEngine } from "../qa/qa-engine.js";
import { runPlaybookChecks } from "../qa/playbook-runner.js";
import { detectVisualRegression } from "../qa/detectors/visual-detector.js";
import type { LeadData, QaTask, RunContext } from "../shared/types.js";
import { assertSafeAction } from "../shared/safety-guard.js";
import { sitesMemory } from "../memory/sites-memory.js";
import { writeReports } from "../reports/report-writer.js";
import { GroqClient, type GroqMessage } from "./groq-client.js";
import { groqTools } from "./groq-tool-definitions.js";
import { selectGroqModels } from "./model-router.js";

export async function runGroqToolLoop(task: QaTask, headed: boolean, maxSteps: number, config: AppConfig) {
  const browser = new BrowserAgent(headed);
  const client = new GroqClient(config);
  const generatedLeads: LeadData[] = createRandomLeads(task.testDataCount);
  const screenshots: string[] = [];
  const startedAt = new Date().toISOString();
  const models = selectGroqModels(config);
  let stopRequested = false;
  let loginResult = task.credentials ? "Credentials configured but login is not enabled." : "No credentials provided.";

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: [
        "You are a safe website QA agent.",
        "Use Playwright tools only. Never request destructive actions unless allowed by safety settings.",
        "Never reveal or store passwords, tokens, cookies, or real customer data.",
        "Report bugs directly: concise title, complete error/bug description, clear priority, clear status.",
        "Use specific module/submodule names such as Leads Table, Lead form - Tags, Lead form - Side pane, Lead detail drawer, and Lead delete.",
        "Avoid unnecessary long sentences, but do not cut important details.",
        "If one condition fails, test alternate valid conditions before calling the entire feature failed.",
        "Do not compress complex evidence into one comma-heavy sentence.",
        "For condition matrices, use numbered lines in Description: result count, passed cases, failed cases, condition name, record name, and what happened.",
        "Example: Result: 1/5 conditions saved. Passed: 1. Tag/source/owner - saved and searchable. Failed: 1. Minimal fields - not searchable after Save. 2. Full address - not searchable after Save.",
        "Separate save feedback from data persistence; verify records with search, table refresh, pagination, or direct evidence.",
        "If save feedback is misleading, name the exact UI location such as Add Lead drawer footer or Save action and say what feedback is missing.",
        "Never trust toast text alone; compare toasts with network responses, console errors, inline validation, and final table/search state.",
        "If UI says success but API says an action failed, report the mismatch. Example: delete toast says success while API says Only archived leads can be deleted.",
        "For missing actions, inspect selected-row toolbar, row action menu, bulk toolbar, hover states, tabs, detail drawers, and exact accessible labels.",
        "Open record details through company/detail links when plain row or name cells do not open details.",
        "Inspect icon-only controls by SVG/title/aria/parent button metadata; delete may be an unlabeled trash icon in a detail drawer bottom action area.",
        "Ask before confirming a destructive alternative such as Archive when Delete is unavailable unless explicitly allowed.",
        "User-facing reports are Excel-only by default unless the task explicitly asks for Markdown or JSON.",
        "The first Excel sheet must be a clean bug report with Module, Issue, Description, Priority, Status, Screenshot.",
        "If an issue has screenshot evidence, embed the image directly in that issue row's Screenshot cell on the Bug Report sheet.",
        "Excel reports must be readable without manual resizing: wrapped text, useful widths/heights, frozen headers, and colored headers/priority/status cells.",
        "Do not generate CSV reports.",
        "Do not push reports, screenshots, logs, or local artifacts to GitHub.",
        "When enough evidence is collected, call generate_report."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({
        websiteUrl: task.websiteUrl,
        task: task.task,
        scope: task.scope,
        safety: task.safety,
        loginConfigured: Boolean(task.login?.enabled),
        generatedLeadCount: generatedLeads.length
      })
    }
  ];

  try {
    client.assertReady();
    await browser.start();
    await browser.openUrl(task.websiteUrl);
    await browser.waitForLoad();
    screenshots.push(await browser.screenshot("initial"));
    const configuredLogin = await runConfiguredLogin(browser, task, screenshots);
    loginResult = configuredLogin.resultText;
    messages.push({
      role: "user",
      content: JSON.stringify({
        initialBrowserUrl: browser.getUrl(),
        loginResult,
        instruction: "Continue safe QA from the current browser state. Do not print or store credentials."
      })
    });
    for (let step = 0; step < maxSteps && !stopRequested; step += 1) {
      const response = await client.chat(messages, [...groqTools], models.main).catch(async (error) => {
        messages.push({ role: "assistant", content: `Main model failed: ${error instanceof Error ? error.message : String(error)}. Trying fallback.` });
        return client.chat(messages, [...groqTools], models.fallback);
      });
      if (response.content) messages.push({ role: "assistant", content: response.content });
      if (response.toolCalls.length === 0) {
        messages.push({ role: "user", content: "Continue with the next safe QA tool call or call generate_report." });
        continue;
      }
      for (const call of response.toolCalls) {
        try {
          const result = await executeToolCall(browser, task, generatedLeads, call.function.name, call.function.arguments, screenshots);
          if (call.function.name === "generate_report") stopRequested = true;
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        } catch (toolError) {
          const errorMessage = toolError instanceof Error ? toolError.message : String(toolError);
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: errorMessage, recoverable: true }) });
          browser.recorder.record(`Tool ${call.function.name} failed: ${errorMessage}`);
        }
      }
    }

    const state = await browser.saveBrowserState(screenshots.at(-1));
    const precomputed = await runPlaybookChecks(task.qaProfile, browser, state);
    const detected = runQaEngine(task.qaProfile, state, browser.getConsoleErrors(), browser.getNetworkErrors(), task.scope, precomputed);

    const latestScreenshot = screenshots.at(-1);
    if (latestScreenshot) {
      const visualRegressions = await detectVisualRegression(latestScreenshot, state.url, "final");
      detected.uxIssues.push(...visualRegressions);
    }
    const tracePath = await browser.saveTrace();
    const stepsPerformed = [...browser.recorder.all(), "Groq tool loop completed."];
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
      mode: "groq",
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
      commandLog: browser.recorder.commandLog(),
      qaChecklist: detected.checklist,
      memoryNotes: [
        `QA profile: ${task.qaProfile}`,
        `Risk tier: ${detected.riskTier}`,
        `Coverage confidence: ${coverage.confidence}`,
        `Clickable elements indexed: ${state.clickableElements.length}`,
        ...(tracePath ? [`Trace: ${tracePath}`] : []),
        "Groq should prefer indexed elements and safe selectors from browser state.",
        ...coverage.notes,
        ...detected.guidanceNotes
      ],
      loginResult,
      finalStatus
    };
    return { context, reports: writeReports(context) };
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
      mode: "groq",
      headed,
      startedAt,
      task,
      generatedLeads,
      stepsPerformed,
      bugs: [{
        title: "Groq API mode failed",
        severity: "High",
        area: "Agent runtime",
        description: error instanceof Error ? error.message : String(error),
        suggestedFix: "Check GROQ_API_KEY, model access, network, selectors, and safety scope."
      }],
      uxIssues: [],
      missingValidations: [],
      consoleErrors: browser.getConsoleErrors(),
      networkErrors: browser.getNetworkErrors(),
      screenshots,
      tracePath,
      coverage,
      commandLog: browser.recorder.commandLog(),
      qaChecklist: {},
      memoryNotes: [...coverage.notes, ...(tracePath ? [`Trace: ${tracePath}`] : [])],
      loginResult,
      finalStatus: "Fail"
    };
    return { context, reports: writeReports(context) };
  } finally {
    await browser.close();
  }
}

async function executeToolCall(
  browser: BrowserAgent,
  task: QaTask,
  generatedLeads: LeadData[],
  name: string,
  rawArgs: string,
  screenshots: string[]
): Promise<unknown> {
  const args = rawArgs ? JSON.parse(rawArgs) as Record<string, unknown> : {};
  assertSafeAction(`${name} ${JSON.stringify(args)}`, task.safety);
  switch (name) {
    case "open_url":
      return { url: await browser.openUrl(String(args.url || task.websiteUrl)) };
    case "get_browser_state":
      return browser.saveBrowserState();
    case "click_by_index":
      await browser.clickByIndex(Number(args.index));
      return { ok: true };
    case "click_by_text":
      await browser.clickByText(String(args.text || ""));
      return { ok: true };
    case "click_by_role":
      await browser.clickByRole(String(args.role || "button"), args.name ? String(args.name) : undefined);
      return { ok: true };
    case "click_selector":
    case "click":
      await browser.click(String(args.selector));
      return { ok: true };
    case "fill_selector":
    case "fill_input":
      await browser.fill(String(args.selector), String(args.value || ""));
      return { ok: true };
    case "fill_by_label":
      await browser.fillByLabel(String(args.label || ""), String(args.value || ""));
      return { ok: true };
    case "fill_by_placeholder":
      await browser.fillByPlaceholder(String(args.placeholder || ""), String(args.value || ""));
      return { ok: true };
    case "fill_by_name":
      await browser.fillByName(String(args.name || ""), String(args.value || ""));
      return { ok: true };
    case "press_key":
      await browser.press(String(args.selector), String(args.key || "Enter"));
      return { ok: true };
    case "wait":
      await browser.wait(Number(args.ms || 1000));
      return { ok: true };
    case "take_screenshot": {
      const path = await browser.screenshot(String(args.label || "groq"));
      screenshots.push(path);
      return { path };
    }
    case "get_page_text":
      return { text: await browser.getPageText() };
    case "get_page_state":
      return browser.saveBrowserState();
    case "get_console_errors":
      return { errors: browser.getConsoleErrors() };
    case "get_network_errors":
      return { errors: browser.getNetworkErrors() };
    case "get_api_responses":
      return { responses: browser.getApiResponses() };
    case "scroll":
    case "scroll_page":
      await browser.scroll(
        (String(args.direction || "down")) as "down" | "up",
        Number(args.amount || 600)
      );
      return { ok: true };
    case "select_option":
      await browser.selectOption(String(args.selector), String(args.value || ""));
      return { ok: true };
    case "hover":
      await browser.hover(String(args.selector));
      return { ok: true };
    case "wait_for_navigation":
      await browser.waitForNavigation();
      return { ok: true };
    case "create_random_lead_data":
    case "generate_test_data":
      return { leads: generatedLeads.slice(0, Number(args.count || generatedLeads.length)) };
    case "remember_site_note": {
      const memory = sitesMemory.read();
      const note = String(args.note || "");
      memory[task.websiteUrl] = {
        ...(memory[task.websiteUrl] || {}),
        usefulNotes: [...(memory[task.websiteUrl]?.usefulNotes || []), note]
      };
      sitesMemory.write(memory);
      return { ok: true };
    }
    case "generate_report":
      return { ok: true, message: "Report generation requested." };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
