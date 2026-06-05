import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { ConsoleListener } from "./console-listener.js";
import { NetworkListener } from "./network-listener.js";
import { Recorder } from "./recorder.js";
import { detectBrokenImages, detectFormFields, getPageState, getVisibleButtons, getVisibleInputs } from "./page-analyzer.js";
import { ensureDir, timestampForFile } from "../shared/utils.js";

export class BrowserAgent {
  private browser?: Browser;
  private page?: Page;
  private readonly consoleListener = new ConsoleListener();
  private readonly networkListener = new NetworkListener();
  readonly recorder = new Recorder();

  constructor(private readonly headed: boolean) {}

  async start(): Promise<void> {
    this.browser = await chromium.launch({ headless: !this.headed });
    this.page = await this.browser.newPage();
    this.consoleListener.attach(this.page);
    this.networkListener.attach(this.page);
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }

  get activePage(): Page {
    if (!this.page) throw new Error("Browser has not started.");
    return this.page;
  }

  async openUrl(url: string): Promise<string> {
    await this.activePage.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    this.recorder.record(`Opened ${url}`);
    return this.activePage.url();
  }

  async click(selector: string): Promise<void> {
    await this.activePage.locator(selector).first().click({ timeout: 15_000 });
    this.recorder.record(`Clicked ${selector}`);
  }

  async fill(selector: string, value: string): Promise<void> {
    await this.activePage.locator(selector).first().fill(value, { timeout: 15_000 });
    this.recorder.record(`Filled ${selector}`);
  }

  async press(selector: string, key: string): Promise<void> {
    await this.activePage.locator(selector).first().press(key, { timeout: 15_000 });
    this.recorder.record(`Pressed ${key} on ${selector}`);
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

  getPageState() {
    return getPageState(this.activePage);
  }

  async saveTrace(): Promise<string | undefined> {
    return undefined;
  }
}
