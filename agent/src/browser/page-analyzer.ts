import type { Page } from "playwright";
import { shortText } from "../shared/utils.js";
import type { BrowserState, IndexedElement, VisibleForm, VisibleTable } from "../shared/types.js";

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

export async function getPageState(
  page: Page,
  consoleErrors: string[] = [],
  networkErrors: string[] = [],
  screenshotPath?: string
): Promise<BrowserState> {
  const [url, title, text, buttons, inputs, links, forms, tables, modals, toasts, errorMessages, clickableElements] = await Promise.all([
    page.url(),
    page.title(),
    page.locator("body").innerText({ timeout: 5000 }).catch(() => ""),
    getVisibleButtons(page),
    getVisibleInputs(page),
    getVisibleLinks(page),
    getVisibleForms(page),
    getVisibleTables(page),
    getVisibleText(page, "[role='dialog'], dialog, .modal, [data-state='open']").catch(() => []),
    getVisibleText(page, "[role='status'], [aria-live], .toast, .Toastify__toast").catch(() => []),
    getVisibleText(page, "[role='alert'], .error, .invalid-feedback, [aria-invalid='true']").catch(() => []),
    getClickableElements(page)
  ]);
  return {
    url,
    title,
    textSample: shortText(text),
    buttons,
    inputs,
    links,
    forms,
    tables,
    modals,
    toasts,
    errorMessages,
    clickableElements,
    suggestedSelectors: clickableElements.map((element) => element.selector).filter(Boolean).slice(0, 50),
    screenshotPath,
    consoleErrors,
    networkErrors,
    savedAt: new Date().toISOString()
  };
}

export async function getVisibleLinks(page: Page): Promise<string[]> {
  return page.locator("a[href]").evaluateAll((nodes) =>
    nodes.filter((node) => {
      const element = node as HTMLElement;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    }).map((node) => (node.textContent || (node as HTMLAnchorElement).href || "").trim()).filter(Boolean).slice(0, 80)
  );
}

export async function getClickableElements(page: Page): Promise<IndexedElement[]> {
  return page.locator("button, a[href], input, textarea, select, [role='button'], [role='link'], [role='checkbox'], [role='combobox'], [tabindex]:not([tabindex='-1'])")
    .evaluateAll((nodes) => {
      const visibleNodes = nodes.filter((node) => {
        const element = node as HTMLElement;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      }).slice(0, 100);
      return visibleNodes.map((node, nodeIndex) => {
        const element = node as HTMLElement;
        const input = element as HTMLInputElement;
        const tag = element.tagName.toLowerCase();
        const text = (
          element.textContent ||
          input.value ||
          element.getAttribute("aria-label") ||
          element.getAttribute("placeholder") ||
          element.getAttribute("name") ||
          tag
        ).replace(/\s+/g, " ").trim().slice(0, 160);
        let role = element.getAttribute("role") || undefined;
        if (!role) {
          if (tag === "button") role = "button";
          else if (tag === "a") role = "link";
          else if (tag === "select") role = "combobox";
          else if (tag === "textarea") role = "textbox";
          else if (tag === "input") {
            if (input.type === "checkbox") role = "checkbox";
            else if (input.type === "radio") role = "radio";
            else if (input.type === "submit" || input.type === "button") role = "button";
            else role = "textbox";
          }
        }
        const escapeValue = (element.getAttribute("data-testid") || element.id || element.getAttribute("name") || element.getAttribute("placeholder") || text || tag)
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"');
        let selector = tag;
        if (element.getAttribute("data-testid")) selector = `[data-testid="${escapeValue}"]`;
        else if (element.id) selector = `#${escapeValue}`;
        else if (element.getAttribute("name")) selector = `${tag}[name="${escapeValue}"]`;
        else if (element.getAttribute("placeholder")) selector = `${tag}[placeholder="${escapeValue}"]`;
        else if (role && text) selector = `${tag}[role="${role.replace(/"/g, '\\"')}"]:has-text("${text.slice(0, 40).replace(/"/g, '\\"')}")`;
        else if (text) selector = `${tag}:has-text("${text.slice(0, 40).replace(/"/g, '\\"')}")`;
        return {
          index: nodeIndex + 1,
          tag,
          text,
          selector,
          role,
          visible: true,
          enabled: !(input.disabled || element.getAttribute("aria-disabled") === "true")
        };
      });
    });
}

export async function getVisibleForms(page: Page): Promise<VisibleForm[]> {
  return page.locator("form, [role='form']").evaluateAll((forms) =>
    forms
      .filter((form) => {
        const element = form as HTMLElement;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      })
      .slice(0, 20)
      .map((form, index) => {
        const element = form as HTMLElement;
        const id = element.id ? `#${element.id.replace(/"/g, '\\"')}` : "form";
        return {
          index: index + 1,
          selector: id,
          fieldCount: form.querySelectorAll("input, textarea, select").length,
          submitLabels: Array.from(form.querySelectorAll("button, input[type='submit']"))
            .map((button) => (button.textContent || (button as HTMLInputElement).value || "submit").replace(/\s+/g, " ").trim().slice(0, 160))
            .filter(Boolean)
        };
      })
  );
}

export async function getVisibleTables(page: Page): Promise<VisibleTable[]> {
  return page.locator("table, [role='table'], [role='grid']").evaluateAll((tables) =>
    tables
      .filter((table) => {
        const element = table as HTMLElement;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      })
      .slice(0, 20)
      .map((table, index) => {
        const element = table as HTMLElement;
        const selector = element.id ? `#${element.id.replace(/"/g, '\\"')}` : element.tagName.toLowerCase();
        return {
          index: index + 1,
          selector,
          rowCount: table.querySelectorAll("tr, [role='row']").length,
          columnCount: table.querySelectorAll("th, [role='columnheader']").length,
          headers: Array.from(table.querySelectorAll("th, [role='columnheader']"))
            .map((header) => (header.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160))
            .filter(Boolean)
            .slice(0, 20)
        };
      })
  );
}

async function getVisibleText(page: Page, selector: string): Promise<string[]> {
  return page.locator(selector).evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const element = node as HTMLElement;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      })
      .map((node) => (node.textContent || (node as HTMLElement).getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 160))
      .filter(Boolean)
      .slice(0, 30)
  );
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

function isVisibleElement(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.visibility !== "hidden" &&
    style.display !== "none" &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.right >= 0;
}

function selectorFor(element: HTMLElement, text: string): string {
  const testId = element.getAttribute("data-testid") || element.getAttribute("data-test") || element.getAttribute("data-cy");
  if (testId) return `[data-testid="${cssEscape(testId)}"]`;
  if (element.id) return `#${cssEscape(element.id)}`;
  const name = element.getAttribute("name");
  if (name) return `${element.tagName.toLowerCase()}[name="${cssEscape(name)}"]`;
  const placeholder = element.getAttribute("placeholder");
  if (placeholder) return `${element.tagName.toLowerCase()}[placeholder="${cssEscape(placeholder)}"]`;
  const role = element.getAttribute("role") || inferredRole(element);
  if (role && text) return `${element.tagName.toLowerCase()}[role="${cssEscape(role)}"]:has-text("${cssEscape(text.slice(0, 40))}")`;
  if (text) return `${element.tagName.toLowerCase()}:has-text("${cssEscape(text.slice(0, 40))}")`;
  return element.tagName.toLowerCase();
}

function inferredRole(element: HTMLElement): string | undefined {
  const tag = element.tagName.toLowerCase();
  if (tag === "button") return "button";
  if (tag === "a") return "link";
  if (tag === "select") return "combobox";
  if (tag === "textarea") return "textbox";
  if (tag === "input") {
    const type = (element as HTMLInputElement).type;
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    if (type === "submit" || type === "button") return "button";
    return "textbox";
  }
  return undefined;
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
