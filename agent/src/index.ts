import { loadConfig } from "./config.js";
import { parseCli } from "./cli.js";
import { runCodexDriver } from "./codex-agent/codex-driver.js";
import { runGroqToolLoop } from "./api-agent/groq-tool-loop.js";
import { BrowserAgent } from "./browser/browser-agent.js";

async function main(): Promise<void> {
  const options = parseCli();
  const config = loadConfig();
  if (options.stateOnly) {
    const browser = new BrowserAgent(options.headed, config.usePersistentProfile);
    await browser.start();
    try {
      await browser.openUrl(options.task.websiteUrl);
      await browser.waitForLoad();
      const screenshot = await browser.screenshot("state-only");
      const state = await browser.saveBrowserState(screenshot);
      console.log("\nBrowser state saved.");
      console.log("State JSON: agent/artifacts/state/latest-browser-state.json");
      console.log(`Screenshot: ${screenshot}`);
      console.log(`Clickable elements: ${state.clickableElements.length}`);
    } finally {
      await browser.close();
    }
    return;
  }
  const result = options.mode === "groq"
    ? await runGroqToolLoop(options.task, options.headed, options.maxSteps, config)
    : await runCodexDriver(options.task, options.headed);

  console.log("\nQA run complete.");
  if (result.reports.markdownPath) console.log(`Markdown report: ${result.reports.markdownPath}`);
  if (result.reports.jsonPath) console.log(`JSON report: ${result.reports.jsonPath}`);
  if (result.reports.excelPath) console.log(`Excel report: ${result.reports.excelPath}`);
  console.log(`Final status: ${result.context.finalStatus}`);
  if (result.context.finalStatus === "Fail" && result.context.bugs[0]) {
    console.log(`Top issue: ${result.context.bugs[0].title} - ${result.context.bugs[0].description}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
