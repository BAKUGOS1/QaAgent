import type { AppConfig } from "../config.js";
import { BrowserAgent } from "../browser/browser-agent.js";
import { createRandomLeads } from "../data/lead-data.js";
import { detectIssues } from "../qa/issue-detector.js";
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
  client.assertReady();
  const generatedLeads: LeadData[] = createRandomLeads(task.testDataCount);
  const screenshots: string[] = [];
  const startedAt = new Date().toISOString();
  const models = selectGroqModels(config);
  let stopRequested = false;

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: [
        "You are a safe website QA agent.",
        "Use Playwright tools only. Never request destructive actions unless allowed by safety settings.",
        "Never reveal or store passwords, tokens, cookies, or real customer data.",
        "Report bugs directly: concise title, complete error/bug description, clear priority, clear status.",
        "Avoid unnecessary long sentences, but do not cut important details.",
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
        generatedLeadCount: generatedLeads.length
      })
    }
  ];

  try {
    await browser.start();
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
        const result = await executeToolCall(browser, task, generatedLeads, call.function.name, call.function.arguments, screenshots);
        if (call.function.name === "generate_report") stopRequested = true;
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    const state = await browser.getPageState();
    const detected = detectIssues(state, browser.getConsoleErrors(), browser.getNetworkErrors());
    const context: RunContext = {
      mode: "groq",
      headed,
      startedAt,
      task,
      generatedLeads,
      stepsPerformed: [...browser.recorder.all(), "Groq tool loop completed."],
      bugs: detected.bugs,
      uxIssues: detected.uxIssues,
      missingValidations: detected.missingValidations,
      consoleErrors: browser.getConsoleErrors(),
      networkErrors: browser.getNetworkErrors(),
      screenshots,
      loginResult: task.credentials ? "Credentials configured; Groq can use safe task steps/tools without printing secrets." : "No credentials provided.",
      finalStatus: detected.bugs.length ? "Partial Pass" : "Pass"
    };
    return { context, reports: writeReports(context) };
  } catch (error) {
    const context: RunContext = {
      mode: "groq",
      headed,
      startedAt,
      task,
      generatedLeads,
      stepsPerformed: browser.recorder.all(),
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
      loginResult: "Not completed.",
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
    case "click":
      await browser.click(String(args.selector));
      return { ok: true };
    case "fill_input":
      await browser.fill(String(args.selector), String(args.value || ""));
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
      return browser.getPageState();
    case "get_console_errors":
      return { errors: browser.getConsoleErrors() };
    case "get_network_errors":
      return { errors: browser.getNetworkErrors() };
    case "create_random_lead_data":
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
