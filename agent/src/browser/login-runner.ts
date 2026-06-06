import type { QaTask } from "../shared/types.js";
import type { BrowserAgent } from "./browser-agent.js";
import { smartLogin } from "./smart-login.js";

export interface ConfiguredLoginRun {
  resultText: string;
  screenshotPath?: string;
}

export async function runConfiguredLogin(
  browser: BrowserAgent,
  task: QaTask,
  screenshots: string[]
): Promise<ConfiguredLoginRun> {
  if (!task.login?.enabled) {
    return {
      resultText: task.credentials ? "Credentials configured but login is not enabled." : "No credentials provided."
    };
  }

  try {
    const result = await smartLogin(browser, task.credentials, task.login);
    const screenshotPath = result.attempted ? await browser.screenshot(result.status === "Pass" ? "login-pass" : "login-check") : undefined;
    if (screenshotPath) screenshots.push(screenshotPath);

    if (result.status === "Pass") {
      await reopenTargetAfterLogin(browser, task);
    }

    return { resultText: `${result.status}: ${result.message}`, screenshotPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      resultText: `Fail: Login automation failed before completion. ${message}`
    };
  }
}

async function reopenTargetAfterLogin(browser: BrowserAgent, task: QaTask): Promise<void> {
  if (!task.websiteUrl) return;
  if (browser.getUrl() === task.websiteUrl) return;
  await browser.openUrl(task.websiteUrl).catch(() => undefined);
  await browser.waitForLoad().catch(() => undefined);
}
