import { loadConfig } from "./config.js";
import { parseCli } from "./cli.js";
import { runCodexDriver } from "./codex-agent/codex-driver.js";
import { runGroqToolLoop } from "./api-agent/groq-tool-loop.js";
import { BrowserAgent } from "./browser/browser-agent.js";
import { runConfiguredLogin } from "./browser/login-runner.js";
import { logger } from "./shared/logger.js";

async function main(): Promise<void> {
  const options = parseCli();
  const config = loadConfig();
  if (options.stateOnly) {
    const browser = new BrowserAgent(options.headed, config.usePersistentProfile);
    await browser.start();
    try {
      await browser.openUrl(options.task.websiteUrl);
      await browser.waitForLoad();
      const screenshots: string[] = [];
      screenshots.push(await browser.screenshot("state-only"));
      const login = await runConfiguredLogin(browser, options.task, screenshots);
      const screenshot = screenshots.at(-1);
      const state = await browser.saveBrowserState(screenshot);
      logger.info("Browser state saved.");
      logger.info(`State JSON: agent/artifacts/state/latest-browser-state.json`);
      if (screenshot) logger.info(`Screenshot: ${screenshot}`);
      logger.info(`Login: ${login.resultText}`);
      logger.info(`Clickable elements: ${state.clickableElements.length}`);
    } finally {
      await browser.close();
    }
    return;
  }
  const result = options.mode === "groq"
    ? await runGroqToolLoop(options.task, options.headed, options.maxSteps, config)
    : await runCodexDriver(options.task, options.headed);

  logger.info("QA run complete.");
  if (result.reports.markdownPath) logger.info(`Markdown report: ${result.reports.markdownPath}`);
  if (result.reports.jsonPath) logger.info(`JSON report: ${result.reports.jsonPath}`);
  if (result.reports.excelPath) logger.info(`Excel report: ${result.reports.excelPath}`);
  logger.info(`Final status: ${result.context.finalStatus}`);
  if (result.context.finalStatus === "Fail" && result.context.bugs[0]) {
    logger.warn(`Top issue: ${result.context.bugs[0].title} - ${result.context.bugs[0].description}`);
  }
}

main().catch((error) => {
  logger.error("Application crashed", error);
  process.exitCode = 1;
});
