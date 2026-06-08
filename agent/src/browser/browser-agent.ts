import path from "node:path";
import fs from "node:fs";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { ConsoleListener } from "./console-listener.js";
import { NetworkListener } from "./network-listener.js";
import { Recorder } from "./recorder.js";
import { detectBrokenImages, detectFormFields, getPageState, getVisibleButtons, getVisibleInputs } from "./page-analyzer.js";
import { resolveSelector } from "./selector-healer.js";
import { ensureDir, timestampForFile } from "../shared/utils.js";
import type { BrowserState } from "../shared/types.js";

export class BrowserAgent {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private traceStarted = false;
  private cachedState?: BrowserState;
  private stateStale = true;
  private readonly consoleListener = new ConsoleListener();
  private readonly networkListener = new NetworkListener();
  readonly recorder = new Recorder();

  constructor(
    private readonly headed: boolean,
    private readonly usePersistentProfile = (process.env.USE_PERSISTENT_PROFILE || "false").toLowerCase() === "true"
  ) {}

  async start(): Promise<void> {
    if (this.usePersistentProfile) {
      const profileDir = path.join(process.cwd(), "agent", ".browser-profile");
      ensureDir(profileDir);
      this.context = await chromium.launchPersistentContext(profileDir, { headless: !this.headed });
      this.page = await this.context.newPage();
      this.recorder.record(`Started persistent browser profile at ${profileDir}`);
    } else {
      this.browser = await chromium.launch({ headless: !this.headed });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
    }
    await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true }).then(() => {
      this.traceStarted = true;
      this.recorder.record("Started Playwright trace capture");
    }).catch(() => undefined);
    this.consoleListener.attach(this.page);
    this.networkListener.attach(this.page);

    // Listen for new pages/popups
    this.context.on("page", (newPage) => {
      this.consoleListener.attach(newPage);
      this.networkListener.attach(newPage);
      this.recorder.record(`New page/popup opened: ${newPage.url()}`);
    });
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }

  get activePage(): Page {
    if (!this.page) throw new Error("Browser has not started.");
    return this.page;
  }

  /** Switch focus to a popup/new tab if one was opened */
  async switchToLatestPage(): Promise<void> {
    if (!this.context) return;
    const pages = this.context.pages();
    if (pages.length > 1) {
      this.page = pages[pages.length - 1];
      this.consoleListener.attach(this.page);
      this.networkListener.attach(this.page);
      this.markStateStale();
      this.recorder.record(`Switched to page: ${this.page.url()}`);
    }
  }

  private markStateStale(): void {
    this.stateStale = true;
    this.cachedState = undefined;
  }

  async openUrl(url: string): Promise<string> {
    await this.activePage.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    this.recorder.record(`Opened ${url}`);
    this.markStateStale();
    await this.saveBrowserState();
    return this.activePage.url();
  }

  async click(selector: string): Promise<void> {
    try {
      await this.activePage.locator(selector).first().click({ timeout: 15_000 });
    } catch {
      // Fallback: try selector healer
      const healed = await resolveSelector(this, this.getUrl(), selector, selector);
      if (healed.selector && healed.strategy !== "failed") {
        await this.activePage.locator(healed.selector).first().click({ timeout: 15_000 });
        this.recorder.record(`Healed selector (${healed.strategy}): ${selector} → ${healed.selector}`);
      } else {
        throw new Error(`Click failed: selector "${selector}" not found even after healing.`);
      }
    }
    this.recorder.record(`Clicked ${selector}`);
    this.markStateStale();
  }

  async clickByIndex(index: number): Promise<void> {
    const state = await this.saveBrowserState();
    const element = state.clickableElements.find((item) => item.index === index);
    if (!element) throw new Error(`No clickable element found at index ${index}.`);
    await this.click(element.selector);
    this.recorder.record(`Clicked indexed element ${index}: ${element.text || element.selector}`);
  }

  async clickByText(text: string): Promise<void> {
    await this.activePage.getByText(text, { exact: false }).first().click({ timeout: 15_000 });
    this.recorder.record(`Clicked text ${text}`);
    this.markStateStale();
  }

  async clickByRole(role: string, name?: string): Promise<void> {
    await this.activePage.getByRole(role as never, name ? { name } : undefined).first().click({ timeout: 15_000 });
    this.recorder.record(`Clicked role ${role}${name ? ` named ${name}` : ""}`);
    this.markStateStale();
  }

  async fill(selector: string, value: string): Promise<void> {
    try {
      await this.activePage.locator(selector).first().fill(value, { timeout: 15_000 });
    } catch {
      const healed = await resolveSelector(this, this.getUrl(), selector, selector);
      if (healed.selector && healed.strategy !== "failed") {
        await this.activePage.locator(healed.selector).first().fill(value, { timeout: 15_000 });
        this.recorder.record(`Healed selector (${healed.strategy}): ${selector} → ${healed.selector}`);
      } else {
        throw new Error(`Fill failed: selector "${selector}" not found even after healing.`);
      }
    }
    this.recorder.record(`Filled ${selector}`);
    this.markStateStale();
  }

  async fillByLabel(label: string, value: string): Promise<void> {
    await this.activePage.getByLabel(label, { exact: false }).first().fill(value, { timeout: 15_000 });
    this.recorder.record(`Filled label ${label}`);
    this.markStateStale();
  }

  async fillByPlaceholder(placeholder: string, value: string): Promise<void> {
    await this.activePage.getByPlaceholder(placeholder, { exact: false }).first().fill(value, { timeout: 15_000 });
    this.recorder.record(`Filled placeholder ${placeholder}`);
    this.markStateStale();
  }

  async fillByName(name: string, value: string): Promise<void> {
    await this.fill(`[name="${name.replace(/"/g, '\\"')}"]`, value);
  }

  async press(selector: string, key: string): Promise<void> {
    try {
      await this.activePage.locator(selector).first().press(key, { timeout: 15_000 });
    } catch {
      const healed = await resolveSelector(this, this.getUrl(), selector, selector);
      if (healed.selector && healed.strategy !== "failed") {
        await this.activePage.locator(healed.selector).first().press(key, { timeout: 15_000 });
        this.recorder.record(`Healed selector (${healed.strategy}): ${selector} → ${healed.selector}`);
      } else {
        throw new Error(`Press failed: selector "${selector}" not found even after healing.`);
      }
    }
    this.recorder.record(`Pressed ${key} on ${selector}`);
    this.markStateStale();
  }

  async waitForSelector(selector: string): Promise<void> {
    await this.activePage.locator(selector).first().waitFor({ timeout: 15_000 });
    this.recorder.record(`Waited for ${selector}`);
  }

  async waitForLoad(): Promise<void> {
    await this.activePage.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    this.recorder.record("Waited for page load");
    this.markStateStale();
  }

  async waitForNavigation(): Promise<void> {
    await this.activePage.waitForURL(/.+/, { timeout: 15_000 }).catch(() => undefined);
    this.recorder.record("Waited for navigation");
    this.markStateStale();
  }

  async wait(ms: number): Promise<void> {
    await this.activePage.waitForTimeout(ms);
    this.recorder.record(`Waited ${ms}ms`);
  }

  /** Scroll the page by a given direction. Default scrolls down by one viewport. */
  async scroll(direction: "down" | "up" = "down", amount = 600): Promise<void> {
    const delta = direction === "down" ? amount : -amount;
    await this.activePage.mouse.wheel(0, delta);
    await this.activePage.waitForTimeout(300);
    this.recorder.record(`Scrolled ${direction} by ${amount}px`);
    this.markStateStale();
  }

  /** Select an option from a <select> dropdown */
  async selectOption(selector: string, value: string): Promise<void> {
    try {
      await this.activePage.locator(selector).first().selectOption(value, { timeout: 15_000 });
    } catch {
      // Try by label if value didn't match
      await this.activePage.locator(selector).first().selectOption({ label: value }, { timeout: 15_000 });
    }
    this.recorder.record(`Selected option "${value}" in ${selector}`);
    this.markStateStale();
  }

  /** Hover over an element */
  async hover(selector: string): Promise<void> {
    try {
      await this.activePage.locator(selector).first().hover({ timeout: 15_000 });
    } catch {
      const healed = await resolveSelector(this, this.getUrl(), selector, selector);
      if (healed.selector && healed.strategy !== "failed") {
        await this.activePage.locator(healed.selector).first().hover({ timeout: 15_000 });
      } else {
        throw new Error(`Hover failed: selector "${selector}" not found.`);
      }
    }
    this.recorder.record(`Hovered ${selector}`);
    this.markStateStale();
  }

  async screenshot(label = "screenshot"): Promise<string> {
    const dir = path.join(process.cwd(), "agent", "artifacts", "screenshots");
    ensureDir(dir);
    const filePath = path.join(dir, `${timestampForFile()}-${label.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.png`);
    await this.activePage.screenshot({ path: filePath, fullPage: true });
    this.recorder.record(`Captured screenshot ${filePath}`);
    this.markStateStale();
    await this.saveBrowserState(filePath);
    return filePath;
  }

  async getPageText(): Promise<string> {
    return this.activePage.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  }

  getUrl(): string {
    return this.activePage.url();
  }

  async getTitle(): Promise<string> {
    return this.activePage.title();
  }

  getVisibleButtons(): Promise<string[]> {
    return getVisibleButtons(this.activePage);
  }

  getVisibleInputs(): Promise<string[]> {
    return getVisibleInputs(this.activePage);
  }

  getConsoleErrors(): string[] {
    return this.consoleListener.getErrors();
  }

  getNetworkErrors(): string[] {
    return this.networkListener.getErrors();
  }

  getApiResponses(): Array<{ url: string; status: number; body: string }> {
    return this.networkListener.getApiResponses();
  }

  detectBrokenImages(): Promise<string[]> {
    return detectBrokenImages(this.activePage);
  }

  detectFormFields(): Promise<string[]> {
    return detectFormFields(this.activePage);
  }

  getPageState(screenshotPath?: string) {
    return getPageState(this.activePage, this.getConsoleErrors(), this.getNetworkErrors(), screenshotPath);
  }

  /**
   * Save browser state. Uses a lazy cache — if state hasn't changed
   * since last save, returns the cached version.
   */
  async saveBrowserState(screenshotPath?: string): Promise<BrowserState> {
    // If screenshotPath is provided, always refresh (it's an explicit save)
    if (!this.stateStale && this.cachedState && !screenshotPath) {
      return this.cachedState;
    }

    const dir = path.join(process.cwd(), "agent", "artifacts", "state");
    ensureDir(dir);
    const state = await this.getPageState(screenshotPath);
    const filePath = path.join(dir, "latest-browser-state.json");
    fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`);
    this.cachedState = state;
    this.stateStale = false;
    return state;
  }

  /** Force a fresh state capture on next call */
  invalidateState(): void {
    this.markStateStale();
  }

  async saveTrace(): Promise<string | undefined> {
    if (!this.context || !this.traceStarted) return undefined;
    const dir = path.join(process.cwd(), "agent", "artifacts", "traces");
    ensureDir(dir);
    const filePath = path.join(dir, `${timestampForFile()}-trace.zip`);
    try {
      await this.context.tracing.stop({ path: filePath });
      this.traceStarted = false;
      this.recorder.record(`Saved Playwright trace ${filePath}`);
      return filePath;
    } catch {
      this.traceStarted = false;
      return undefined;
    }
  }
}
