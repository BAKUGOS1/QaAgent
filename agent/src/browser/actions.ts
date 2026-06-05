import type { BrowserAgent } from "./browser-agent.js";
import type { TaskStep } from "../shared/types.js";

export async function runTaskStep(browser: BrowserAgent, step: TaskStep): Promise<string | undefined> {
  switch (step.action) {
    case "open":
      await browser.openUrl(step.url || "");
      return undefined;
    case "click":
      await browser.click(required(step.selector, "selector"));
      return undefined;
    case "fill":
      await browser.fill(required(step.selector, "selector"), step.value || "");
      return undefined;
    case "press":
      await browser.press(required(step.selector, "selector"), step.key || "Enter");
      return undefined;
    case "wait":
      if (step.selector) await browser.waitForSelector(step.selector);
      else await browser.wait(Number(step.value || 1000));
      return undefined;
    case "screenshot":
      return browser.screenshot(step.label || "task");
    case "analyze":
      await browser.getPageState();
      return undefined;
  }
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing ${name} for task step.`);
  return value;
}
