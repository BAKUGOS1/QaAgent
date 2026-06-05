import path from "node:path";
import fs from "node:fs";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { ConsoleListener } from "./console-listener.js";
import { NetworkListener } from "./network-listener.js";
import { Recorder } from "./recorder.js";
import { detectBrokenImages, detectFormFields, getPageState, getVisibleButtons, getVisibleInputs } from "./page-analyzer.js";
import { ensureDir, timestampForFile } from "../shared/utils.js";
import type { BrowserState } from "../shared/types.js";

export class BrowserAgent {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
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
    this.consoleListener.attach(this.page);
    this.networkListener.attach(this.page);
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }

  get activePage(): Page {
    if (!this.page) throw new Error("Browser has not started.");
    return this.page;
  }

  async openUrl(url: string): Promise<string> {
    await this.activePage.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    this.recorder.record(`Opened ${url}`);
    await this.saveBrowserState();
    return this.activePage.url();
  }

  async click(selector: string): Promise<void> {
    await this.activePage.locator(selector).first().click({ timeout: 15_000 });
    this.recorder.record(`Clicked ${selector}`);
    await this.saveBrowserState();
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
    await this.saveBrowserState();
  }

  async clickByRole(role: string, name?: string): Promise<void> {
    await this.activePage.getByRole(role as never, name ? { name } : undefined).first().click({ timeout: 15_000 });
    this.recorder.record(`Clicked role ${role}${name ? ` named ${name}` : ""}`);
    await this.saveBrowserState();
  }

  async fill(selector: string, value: string): Promise<void> {
    await this.activePage.locator(selector).first().fill(value, { timeout: 15_000 });
    this.recorder.record(`Filled ${selector}`);
    await this.saveBrowserState();
  }

  async fillByLabel(label: string, value: string): Promise<void> {
    await this.activePage.getByLabel(label, { exact: false }).first().fill(value, { timeout: 15_000 });
    this.recorder.record(`Filled label ${label}`);
    await this.saveBrowserState();
  }

  async fillByPlaceholder(placeholder: string, value: string): Promise<void> {
    await this.activePage.getByPlaceholder(placeholder, { exact: false }).first().fill(value, { timeout: 15_000 });
    this.recorder.record(`Filled placeholder ${placeholder}`);
    await this.saveBrowserState();
  }

  async fillByName(name: string, value: string): Promise<void> {
    await this.fill(`[name="${name.replace(/"/g, '\\"')}"]`, value);
  }

  async press(selector: string, key: string): Promise<void> {
    await this.activePage.locator(selector).first().press(key, { timeout: 15_000 });
    this.recorder.record(`Pressed ${key} on ${selector}`);
    await this.saveBrowserState();
  }

  async waitForSelector(selector: string): Promise<void> {
    await this.activePage.locator(selector).first().waitFor({ timeout: 15_000 });
    this.recorder.record(`Waited for ${selector}`);
  }

  async waitForLoad(): Promise<void> {
    await this.activePage.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    this.recorder.record("Waited for page load");
  }

  async wait(ms: number): Promise<void> {
    await this.activePage.waitForTimeout(ms);
    this.recorder.record(`Waited ${ms}ms`);
  }

  async screenshot(label = "screenshot"): Promise<string> {
    const dir = path.join(process.cwd(), "agent", "artifacts", "screenshots");
    ensureDir(dir);
    const filePath = path.join(dir, `${timestampForFile()}-${label.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.png`);
    await this.activePage.screenshot({ path: filePath, fullPage: true });
    this.recorder.record(`Captured screenshot ${filePath}`);
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

  detectBrokenImages(): Promise<string[]> {
    return detectBrokenImages(this.activePage);
  }

  detectFormFields(): Promise<string[]> {
    return detectFormFields(this.activePage);
  }

  getPageState(screenshotPath?: string) {
    return getPageState(this.activePage, this.getConsoleErrors(), this.getNetworkErrors(), screenshotPath);
  }

  async saveBrowserState(screenshotPath?: string): Promise<BrowserState> {
    const dir = path.join(process.cwd(), "agent", "artifacts", "state");
    ensureDir(dir);
    const state = await this.getPageState(screenshotPath);
    const filePath = path.join(dir, "latest-browser-state.json");
    fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`);
    return state;
  }

  async saveTrace(): Promise<string | undefined> {
    return undefined;
  }
}
