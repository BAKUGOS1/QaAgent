import type { BrowserAgent } from "./browser-agent.js";
import { resolveStepValue } from "./fixtures.js";
import { oneAttempt, retryAssertion, runCypressCommand } from "./cypress-runtime.js";
import type { QaTask, TaskStep } from "../shared/types.js";

export async function runTaskStep(browser: BrowserAgent, step: TaskStep, task?: QaTask): Promise<string | undefined> {
  switch (step.action) {
    case "open":
      return runCypressCommand(browser, task, step, { kind: "action", name: "open", target: required(step.url, "url") }, async () => {
        await browser.openUrl(required(step.url, "url"));
        return oneAttempt(undefined);
      });
    case "click":
      return runCypressCommand(browser, task, step, { kind: "action", name: "click" }, async () => {
        await browser.click(required(step.selector, "selector"));
        return oneAttempt(undefined);
      });
    case "click_by_index":
      return runCypressCommand(browser, task, step, { kind: "action", name: "click_by_index", target: String(requiredNumber(step.index, "index")) }, async () => {
        await browser.clickByIndex(requiredNumber(step.index, "index"));
        return oneAttempt(undefined);
      });
    case "click_by_text":
      return runCypressCommand(browser, task, step, { kind: "action", name: "click_by_text", target: textValue(step, task, "text") }, async () => {
        await browser.clickByText(textValue(step, task, "text"));
        return oneAttempt(undefined);
      });
    case "click_by_role":
      return runCypressCommand(browser, task, step, { kind: "action", name: "click_by_role", target: roleTarget(step, task) }, async () => {
        await browser.clickByRole(required(step.role, "role"), optionalTextValue(step, task));
        return oneAttempt(undefined);
      });
    case "fill":
      return runCypressCommand(browser, task, step, { kind: "action", name: "fill" }, async () => {
        await browser.fill(required(step.selector, "selector"), valueFromStep(step, task));
        return oneAttempt(undefined);
      });
    case "fill_by_label":
      return runCypressCommand(browser, task, step, { kind: "action", name: "fill_by_label", target: required(step.text || step.selector, "label") }, async () => {
        await browser.fillByLabel(required(step.text || step.selector, "label"), valueFromStep(step, task));
        return oneAttempt(undefined);
      });
    case "fill_by_placeholder":
      return runCypressCommand(browser, task, step, { kind: "action", name: "fill_by_placeholder", target: required(step.text || step.selector, "placeholder") }, async () => {
        await browser.fillByPlaceholder(required(step.text || step.selector, "placeholder"), valueFromStep(step, task));
        return oneAttempt(undefined);
      });
    case "fill_by_name":
      return runCypressCommand(browser, task, step, { kind: "action", name: "fill_by_name", target: required(step.text || step.selector, "name") }, async () => {
        await browser.fillByName(required(step.text || step.selector, "name"), valueFromStep(step, task));
        return oneAttempt(undefined);
      });
    case "press":
      return runCypressCommand(browser, task, step, { kind: "action", name: "press", target: required(step.selector, "selector") }, async () => {
        await browser.press(required(step.selector, "selector"), step.key || "Enter");
        return oneAttempt(undefined);
      });
    case "wait":
      return runCypressCommand(browser, task, step, { kind: step.selector ? "query" : "system", name: "wait" }, async () => {
        if (step.selector) await browser.waitForSelector(step.selector);
        else await browser.wait(Number(step.value || 1000));
        return oneAttempt(undefined);
      });
    case "screenshot":
      return runCypressCommand(browser, task, step, { kind: "system", name: "screenshot", target: step.label || "task" }, async () =>
        oneAttempt(await browser.screenshot(step.label || "task"))
      );
    case "analyze":
      return runCypressCommand(browser, task, step, { kind: "system", name: "analyze", target: step.label || "browser-state" }, async () => {
        await browser.saveBrowserState();
        return oneAttempt(undefined);
      });
    case "assert_visible":
      return runCypressCommand(browser, task, step, { kind: "assertion", name: "assert_visible" }, () =>
        retryAssertion(browser, task, step, async () => {
          const visible = await isStepTargetVisible(browser, step, task);
          if (!visible) throw new Error(`Expected target to be visible: ${step.selector || step.text || step.role || step.value || step.label || "unknown"}`);
          return undefined;
        })
      );
    case "assert_text":
      return runCypressCommand(browser, task, step, { kind: "assertion", name: "assert_text", target: expectedValue(step, task) }, () =>
        retryAssertion(browser, task, step, async () => {
          const expected = expectedValue(step, task);
          const actual = step.selector
            ? await browser.activePage.locator(step.selector).first().innerText({ timeout: 750 }).catch(() => "")
            : await browser.activePage.locator("body").innerText({ timeout: 750 }).catch(() => "");
          if (!actual.includes(expected)) throw new Error(`Expected page text to include "${expected}".`);
          return undefined;
        })
      );
    case "assert_url_includes":
      return runCypressCommand(browser, task, step, { kind: "assertion", name: "assert_url_includes", target: expectedValue(step, task) }, () =>
        retryAssertion(browser, task, step, async () => {
          const expected = expectedValue(step, task);
          const currentUrl = browser.getUrl();
          if (!currentUrl.includes(expected)) throw new Error(`Expected URL "${currentUrl}" to include "${expected}".`);
          return undefined;
        })
      );
    case "assert_count":
      return runCypressCommand(browser, task, step, { kind: "assertion", name: "assert_count", target: required(step.selector, "selector") }, () =>
        retryAssertion(browser, task, step, async () => {
          const expectedCount = requiredNumber(step.count, "count");
          const actualCount = await browser.activePage.locator(required(step.selector, "selector")).count();
          if (actualCount !== expectedCount) throw new Error(`Expected ${expectedCount} element(s), found ${actualCount}.`);
          return undefined;
        })
      );
  }
}

async function isStepTargetVisible(browser: BrowserAgent, step: TaskStep, task?: QaTask): Promise<boolean> {
  if (step.selector) return browser.activePage.locator(step.selector).first().isVisible().catch(() => false);
  if (step.role) return browser.activePage.getByRole(step.role as never, optionalTextValue(step, task) ? { name: optionalTextValue(step, task) } : undefined).first().isVisible().catch(() => false);
  return browser.activePage.getByText(textValue(step, task, "text"), { exact: false }).first().isVisible().catch(() => false);
}

function valueFromStep(step: TaskStep, task?: QaTask): string {
  return resolveStepValue(step.value || fixtureRef(step.fixture), task);
}

function expectedValue(step: TaskStep, task?: QaTask): string {
  return required(resolveStepValue(step.expected || step.text || step.value || step.url || fixtureRef(step.fixture), task), "expected");
}

function textValue(step: TaskStep, task: QaTask | undefined, name: string): string {
  return required(resolveStepValue(step.text || step.value || fixtureRef(step.fixture), task), name);
}

function optionalTextValue(step: TaskStep, task?: QaTask): string | undefined {
  const value = resolveStepValue(step.text || step.value || fixtureRef(step.fixture), task);
  return value || undefined;
}

function roleTarget(step: TaskStep, task?: QaTask): string {
  const name = optionalTextValue(step, task);
  return `${required(step.role, "role")}${name ? `:${name}` : ""}`;
}

function fixtureRef(fixture: string | undefined): string | undefined {
  if (!fixture) return undefined;
  return fixture.startsWith("fixture:") ? fixture : `fixture:${fixture}`;
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing ${name} for task step.`);
  return value;
}

function requiredNumber(value: number | undefined, name: string): number {
  if (typeof value !== "number") throw new Error(`Missing ${name} for task step.`);
  return value;
}
