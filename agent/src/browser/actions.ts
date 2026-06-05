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
    case "click_by_index":
      await browser.clickByIndex(requiredNumber(step.index, "index"));
      return undefined;
    case "click_by_text":
      await browser.clickByText(required(step.text || step.value, "text"));
      return undefined;
    case "click_by_role":
      await browser.clickByRole(required(step.role, "role"), step.text || step.value);
      return undefined;
    case "fill":
      await browser.fill(required(step.selector, "selector"), step.value || "");
      return undefined;
    case "fill_by_label":
      await browser.fillByLabel(required(step.text || step.selector, "label"), step.value || "");
      return undefined;
    case "fill_by_placeholder":
      await browser.fillByPlaceholder(required(step.text || step.selector, "placeholder"), step.value || "");
      return undefined;
    case "fill_by_name":
      await browser.fillByName(required(step.text || step.selector, "name"), step.value || "");
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
      await browser.saveBrowserState();
      return undefined;
  }
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing ${name} for task step.`);
  return value;
}

function requiredNumber(value: number | undefined, name: string): number {
  if (typeof value !== "number") throw new Error(`Missing ${name} for task step.`);
  return value;
}
