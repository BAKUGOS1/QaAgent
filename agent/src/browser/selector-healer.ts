import type { BrowserAgent } from "./browser-agent.js";
import { selectorsMemory } from "../memory/selectors-memory.js";

export interface SelectorHealResult {
  selector?: string;
  strategy: "explicit" | "memory" | "role-text" | "indexed" | "failed";
}

export async function resolveSelector(
  browser: BrowserAgent,
  siteUrl: string,
  selectorKey: string,
  explicitSelector?: string,
  textHint?: string
): Promise<SelectorHealResult> {
  if (explicitSelector && await canFind(browser, explicitSelector)) {
    remember(siteUrl, selectorKey, explicitSelector);
    return { selector: explicitSelector, strategy: "explicit" };
  }
  const memory = selectorsMemory.read();
  const stored = memory[siteUrl]?.[selectorKey];
  if (stored && await canFind(browser, stored)) return { selector: stored, strategy: "memory" };
  if (textHint) {
    const roleSelector = `button:has-text("${textHint.replace(/"/g, '\\"')}"), a:has-text("${textHint.replace(/"/g, '\\"')}")`;
    if (await canFind(browser, roleSelector)) {
      remember(siteUrl, selectorKey, roleSelector);
      return { selector: roleSelector, strategy: "role-text" };
    }
  }
  const state = await browser.saveBrowserState();
  const indexed = state.clickableElements.find((element) =>
    textHint ? element.text.toLowerCase().includes(textHint.toLowerCase()) : element.selector
  );
  if (indexed) {
    remember(siteUrl, selectorKey, indexed.selector);
    return { selector: indexed.selector, strategy: "indexed" };
  }
  return { strategy: "failed" };
}

async function canFind(browser: BrowserAgent, selector: string): Promise<boolean> {
  return browser.activePage.locator(selector).first().count().then((count) => count > 0).catch(() => false);
}

function remember(siteUrl: string, key: string, selector: string): void {
  const memory = selectorsMemory.read();
  memory[siteUrl] = { ...(memory[siteUrl] || {}), [key]: selector };
  selectorsMemory.write(memory);
}

