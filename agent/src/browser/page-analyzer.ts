import type { Page } from "playwright";
import { shortText } from "../shared/utils.js";
import type { BrowserState } from "../shared/types.js";

export async function getVisibleButtons(page: Page): Promise<string[]> {
  return page.locator("button, [role='button'], input[type='submit']").evaluateAll((nodes) =>
    nodes
      .map((node) => (node.textContent || node.getAttribute("value") || node.getAttribute("aria-label") || "").trim())
      .filter(Boolean)
      .slice(0, 50)
  );
}

export async function getVisibleInputs(page: Page): Promise<string[]> {
  return page.locator("input, textarea, select").evaluateAll((nodes) =>
    nodes
      .map((node) => {
        const element = node as HTMLInputElement;
        return element.getAttribute("name") || element.getAttribute("placeholder") || element.getAttribute("aria-label") || element.type || "input";
      })
      .filter(Boolean)
      .slice(0, 50)
  );
}

export async function getPageState(page: Page): Promise<BrowserState> {
  const [url, title, text, buttons, inputs] = await Promise.all([
    page.url(),
    page.title(),
    page.locator("body").innerText({ timeout: 5000 }).catch(() => ""),
    getVisibleButtons(page),
    getVisibleInputs(page)
  ]);
  return {
    url,
    title,
    textSample: shortText(text),
    buttons,
    inputs
  };
}

export async function detectBrokenImages(page: Page): Promise<string[]> {
  return page.locator("img").evaluateAll((images) =>
    images
      .filter((image) => {
        const img = image as HTMLImageElement;
        return img.complete && img.naturalWidth === 0;
      })
      .map((image) => (image as HTMLImageElement).src)
  );
}

export async function detectFormFields(page: Page): Promise<string[]> {
  return getVisibleInputs(page);
}
