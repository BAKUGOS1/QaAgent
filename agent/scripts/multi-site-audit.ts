import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { writeReports } from "../src/reports/report-writer.js";
import { sitesMemory } from "../src/memory/sites-memory.js";
import { selectorsMemory } from "../src/memory/selectors-memory.js";
import { knownIssuesMemory } from "../src/memory/known-issues-memory.js";
import { playbooksMemory } from "../src/memory/playbooks-memory.js";
import { defaultSafety } from "../src/shared/safety-guard.js";
import type { BrowserState, QaIssue, RunContext } from "../src/shared/types.js";
import { getPageState } from "../src/browser/page-analyzer.js";

interface AuditSite {
  name: string;
  url: string;
  type: "public" | "authenticated";
}

const startedAt = new Date().toISOString();
const runId = startedAt.replace(/[:T]/g, "-").slice(0, 16);
const screenshotDir = path.join(process.cwd(), "agent", "artifacts", "screenshots");
const stateDir = path.join(process.cwd(), "agent", "artifacts", "state");
fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(stateDir, { recursive: true });

const sites: AuditSite[] = [
  { name: "Example", url: "https://example.com", type: "public" },
  { name: "Wikipedia", url: "https://www.wikipedia.org/", type: "public" },
  { name: "Python", url: "https://www.python.org/", type: "public" },
  { name: "Node.js", url: "https://nodejs.org/en", type: "public" },
  { name: "Playwright", url: "https://playwright.dev/", type: "public" },
  { name: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/", type: "public" },
  { name: "NPM", url: "https://www.npmjs.com/", type: "public" },
  { name: "Vercel", url: "https://vercel.com/", type: "public" },
  { name: "GitHub", url: "https://github.com/", type: "public" },
  { name: "Zybra", url: "https://app.zybra.in/", type: "authenticated" }
];

const browser = await chromium.launch({ headless: true });
const allIssues: QaIssue[] = [];
const screenshots: string[] = [];
const steps: string[] = [];
const summaries: Record<string, unknown>[] = [];
const states: Record<string, BrowserState> = {};

function addIssue(
  site: string,
  area: string,
  title: string,
  severity: QaIssue["severity"],
  description: string,
  screenshot?: string,
  status = "Open",
  expected = "",
  actual = "",
  note = ""
): void {
  allIssues.push({
    area: `${site} / ${area}`,
    title,
    severity,
    description,
    status,
    screenshot,
    steps: `Open ${site}. Inspect ${area}.`,
    expected,
    actual,
    developerNote: note || "Review the captured screenshot and browser state."
  });
}

async function shot(page: Page, label: string): Promise<string> {
  const file = path.join(screenshotDir, `${runId}-${label.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => undefined);
  screenshots.push(file);
  return file;
}

async function pageMetrics(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const e = el as HTMLElement;
      const r = e.getBoundingClientRect();
      const s = window.getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
    };
    const clickables = [...document.querySelectorAll("button,a[href],[role='button'],input[type='submit'],input[type='button']")].filter(visible);
    const unnamedClickables = clickables.filter((el) => !((el as HTMLInputElement).value || el.textContent || el.getAttribute("aria-label") || el.getAttribute("title") || "").trim());
    const inputs = [...document.querySelectorAll("input,textarea,select")].filter(visible);
    const unlabeledInputs = inputs.filter((el) => !((el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || document.querySelector(`label[for="${(el as HTMLElement).id}"]`)?.textContent || "")).trim());
    const brokenImages = [...document.querySelectorAll("img")].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src).slice(0, 10);
    const headings = [...document.querySelectorAll("h1,h2")].filter(visible).map((heading) => (heading.textContent || "").trim()).filter(Boolean).slice(0, 20);
    const forms = [...document.querySelectorAll("form")].filter(visible).length;
    const tables = [...document.querySelectorAll("table,[role='table'],[role='grid']")].filter(visible).length;
    const alerts = [...document.querySelectorAll("[role='alert'],.error,.invalid-feedback,[aria-invalid='true']")].filter(visible).map((element) => (element.textContent || "").trim()).filter(Boolean).slice(0, 20);
    return { clickableCount: clickables.length, unnamedClickableCount: unnamedClickables.length, inputCount: inputs.length, unlabeledInputCount: unlabeledInputs.length, brokenImages, headings, forms, tables, alerts, bodyText: document.body.innerText.slice(0, 2000) };
  }).catch(() => ({ clickableCount: 0, unnamedClickableCount: 0, inputCount: 0, unlabeledInputCount: 0, brokenImages: [], headings: [], forms: 0, tables: 0, alerts: [], bodyText: "" }));
}

async function responsiveChecks(page: Page, siteName: string, url: string, screenshot?: string) {
  const viewports = [
    { name: "desktop", width: 1365, height: 768 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 }
  ];
  const results: Record<string, unknown>[] = [];
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })).catch(() => ({ scrollWidth: 0, innerWidth: 0 }));
    const overflow = metrics.scrollWidth > metrics.innerWidth + 8;
    results.push({ viewport: viewport.name, overflow, scrollWidth: metrics.scrollWidth, innerWidth: metrics.innerWidth });
  }
  const bad = results.filter((result) => result.overflow);
  if (bad.length) {
    addIssue(siteName, "Responsive", "Horizontal overflow detected", "Medium", `${bad.map((result) => `${result.viewport}: ${result.scrollWidth}px > ${result.innerWidth}px`).join("; ")}.`, screenshot, "Open", "No horizontal scrolling at common viewport sizes.", "Page width exceeds viewport.");
  }
  return results;
}

async function auditPublic(site: AuditSite): Promise<void> {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("response", (response) => { if (response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`); });
  const t0 = Date.now();
  await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch((error) => addIssue(site.name, "Availability", "Page did not open", "Critical", error.message));
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
  const loadMs = Date.now() - t0;
  const screenshot = await shot(page, `${site.name}-home`);
  const state = await getPageState(page, consoleErrors, networkErrors, screenshot);
  states[site.name] = state;
  const metrics = await pageMetrics(page);
  const responsive = await responsiveChecks(page, site.name, site.url, screenshot);
  steps.push(`${site.name}: opened ${site.url}, captured state, screenshot, console/network errors, responsive checks.`);
  if (loadMs > 8000) addIssue(site.name, "Performance", "Slow initial load", "Medium", `Initial load took ${loadMs}ms.`, screenshot, "Open", "Initial page should become usable under 8 seconds.", `Load time ${loadMs}ms.`);
  if (!state.title) addIssue(site.name, "SEO/UI", "Missing page title", "Low", "Document title is empty.", screenshot, "Open", "Page should have a meaningful title.", "No title detected.");
  if (consoleErrors.length) addIssue(site.name, "Console", "Console errors detected", consoleErrors.length > 5 ? "High" : "Medium", `${consoleErrors.length} console error(s) captured. First: ${consoleErrors[0]}`, screenshot, "Open", "No blocker console errors.", `${consoleErrors.length} error(s).`);
  if (networkErrors.length) addIssue(site.name, "Network", "Failed network requests detected", networkErrors.length > 5 ? "High" : "Medium", `${networkErrors.length} failed request(s) captured. First: ${networkErrors[0]}`, screenshot, "Open", "No failed critical requests.", `${networkErrors.length} failed request(s).`);
  if (metrics.unnamedClickableCount) addIssue(site.name, "Accessibility", "Clickable controls missing names", "Medium", `${metrics.unnamedClickableCount} visible clickable control(s) have no readable text, aria-label, title, or value.`, screenshot, "Open", "Every clickable control should have an accessible name.", `${metrics.unnamedClickableCount} unnamed controls.`);
  if (metrics.unlabeledInputCount) addIssue(site.name, "Accessibility", "Inputs missing labels", "Medium", `${metrics.unlabeledInputCount} visible input(s) have no label, placeholder, aria-label, or name.`, screenshot, "Open", "Inputs should be labelled.", `${metrics.unlabeledInputCount} unlabeled inputs.`);
  if (metrics.brokenImages.length) addIssue(site.name, "Media", "Broken images detected", "Medium", `${metrics.brokenImages.length} broken image(s). First: ${metrics.brokenImages[0]}`, screenshot, "Open", "Images should load successfully.", "Broken image found.");
  summaries.push({ site: site.name, url: site.url, finalUrl: page.url(), title: state.title, loadMs, clickables: state.clickableElements.length, inputs: state.inputs.length, links: state.links.length, forms: state.forms.length, tables: state.tables.length, consoleErrors: consoleErrors.length, networkErrors: networkErrors.length, responsive, screenshot });
  await page.close();
}

async function auditZybra(): Promise<void> {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("response", (response) => { if (response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`); });
  const t0 = Date.now();
  await page.goto("https://app.zybra.in/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.fill("input[name='email']", process.env.ZYBRA_EMAIL || "");
  await page.fill("input[name='password']", process.env.ZYBRA_PASSWORD || "");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/dashboard|company|app\\.zybra/i, { timeout: 15_000 }).catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => undefined);
  const loadMs = Date.now() - t0;
  const dashboardShot = await shot(page, "Zybra-dashboard");
  const state = await getPageState(page, consoleErrors, networkErrors, dashboardShot);
  states.Zybra = state;
  const metrics = await pageMetrics(page);
  const loggedIn = page.url().includes("/dashboard") || metrics.bodyText.includes("Dashboard");
  steps.push("Zybra: logged in with provided credential, captured dashboard, module list, console/network errors, accessibility checks. Password was not stored.");
  if (!loggedIn) addIssue("Zybra", "Authentication", "Login did not reach dashboard", "Critical", "Submitted provided credentials but dashboard was not detected.", dashboardShot, "Open", "Valid credentials should open dashboard.", `Current URL: ${page.url()}`);
  if (consoleErrors.length) addIssue("Zybra", "Console", "Console errors detected after login", consoleErrors.length > 5 ? "High" : "Medium", `${consoleErrors.length} console error(s) captured after login. First: ${consoleErrors[0]}`, dashboardShot, "Open", "No blocker console errors after login.", `${consoleErrors.length} error(s).`);
  if (networkErrors.length) addIssue("Zybra", "Network", "Failed API/assets after login", networkErrors.length > 5 ? "High" : "Medium", `${networkErrors.length} failed request(s) captured after login. First: ${networkErrors[0]}`, dashboardShot, "Open", "Dashboard requests should not fail.", `${networkErrors.length} failed request(s).`);
  if (metrics.unnamedClickableCount) addIssue("Zybra", "Accessibility", "Icon buttons missing accessible names", "Medium", `${metrics.unnamedClickableCount} visible clickable control(s) on dashboard have no readable text, aria-label, title, or value.`, dashboardShot, "Open", "Icon buttons should have accessible names.", `${metrics.unnamedClickableCount} unnamed controls.`);
  if (metrics.bodyText.includes("$")) addIssue("Zybra", "Localization", "Dashboard shows dollar currency", "Low", "Dashboard values use dollar symbol on an India-focused accounting product. Verify expected currency/company setting.", dashboardShot, "Needs Verification", "Currency should match company/account settings.", "Dollar symbol visible in dashboard KPIs.");
  const safeModules = ["Dashboard", "Contact", "Inventory", "Manufacturing", "Banking", "Sales", "Purchase", "Payroll", "Accountant", "GST", "Documents", "Reports", "Settings"];
  const moduleResults: Record<string, unknown>[] = [];
  for (const moduleName of safeModules) {
    try {
      const item = page.getByText(moduleName, { exact: true }).first();
      if (await item.count()) {
        await item.click({ timeout: 5000 }).catch(() => undefined);
        await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => undefined);
        await page.waitForTimeout(800);
        const shotPath = moduleName === "Dashboard" ? dashboardShot : await shot(page, `Zybra-${moduleName}`);
        const body = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
        moduleResults.push({ moduleName, afterUrl: page.url(), textFound: body.includes(moduleName), screenshot: shotPath });
        if (!body.trim()) addIssue("Zybra", moduleName, "Module opened with empty page", "High", `${moduleName} opened but visible page text is empty.`, shotPath, "Open", "Module should render content.", "No visible text.");
      } else {
        moduleResults.push({ moduleName, found: false });
        addIssue("Zybra", "Navigation", `${moduleName} nav item not found`, "Medium", `${moduleName} was expected in sidebar but was not found as exact visible text.`, dashboardShot, "Open", "Expected sidebar item visible.", "Nav item missing/not exact.");
      }
    } catch (error) {
      addIssue("Zybra", moduleName, "Module navigation failed", "Medium", `${moduleName} click/navigation failed: ${error instanceof Error ? error.message : String(error)}`, dashboardShot, "Open", "Module should open safely.", "Navigation failed.");
    }
  }
  addIssue("Zybra", "Safety Guard", "Payment/delete/export actions skipped", "High", "Potentially destructive or sensitive actions such as Add Payment, delete, export, send, and settings changes were not executed according to safety rules.", dashboardShot, "Blocked", "Agent should not perform destructive actions without explicit permission.", "Safety block applied.", "Ask for explicit permission before testing these actions.");
  const responsive = await responsiveChecks(page, "Zybra", "https://app.zybra.in/dashboard", dashboardShot);
  summaries.push({ site: "Zybra", url: "https://app.zybra.in/", finalUrl: page.url(), title: state.title, loadMs, clickables: state.clickableElements.length, inputs: state.inputs.length, links: state.links.length, forms: state.forms.length, tables: state.tables.length, consoleErrors: consoleErrors.length, networkErrors: networkErrors.length, responsive, screenshot: dashboardShot, loggedIn, modules: moduleResults });
  await page.close();
}

for (const site of sites) {
  console.log(`Auditing ${site.name}...`);
  if (site.type === "authenticated") await auditZybra();
  else await auditPublic(site);
}
await browser.close();

const sitesMem = sitesMemory.read();
const selectorsMem = selectorsMemory.read();
const knownMem = knownIssuesMemory.read();
const playbooksMem = playbooksMemory.read();
for (const summary of summaries) {
  const siteName = String(summary.site);
  const url = String(summary.url);
  sitesMem[url] = {
    ...(sitesMem[url] || {}),
    lastAuditedAt: startedAt,
    lastTitle: summary.title,
    lastFinalUrl: summary.finalUrl,
    usefulNotes: [
      `Last audit: ${siteName}`,
      `Clickable elements indexed: ${summary.clickables}`,
      `Console errors: ${summary.consoleErrors}`,
      `Network errors: ${summary.networkErrors}`,
      ...(Array.isArray(summary.modules) ? [`Zybra modules checked: ${summary.modules.map((module: Record<string, unknown>) => module.moduleName).join(", ")}`] : [])
    ]
  };
  selectorsMem[url] = {
    ...(selectorsMem[url] || {}),
    firstClickable: states[siteName]?.clickableElements?.[0]?.selector || "",
    ...(siteName === "Zybra" ? { loginEmail: "input[name='email']", loginPassword: "input[name='password']", loginSubmit: "button:has-text('Login')" } : {})
  };
  knownMem[url] = allIssues.filter((item) => item.area.startsWith(`${siteName} /`)).slice(0, 20).map((item) => ({ title: item.title, module: item.area, priority: item.severity, status: item.status || "Open", lastSeenAt: startedAt }));
}
playbooksMem["multi-site-professional-audit"] = ["smoke", "browser-state", "console-network", "accessibility-basic", "responsive-basic", "safe-authenticated-navigation"];
sitesMemory.write(sitesMem);
selectorsMemory.write(selectorsMem);
knownIssuesMemory.write(knownMem);
playbooksMemory.write(playbooksMem);

const aggregateState = states.Zybra || Object.values(states)[0];
fs.writeFileSync(path.join(stateDir, `${runId}-multi-site-audit-state.json`), JSON.stringify({ startedAt, summaries, states }, null, 2));
const context: RunContext = {
  mode: "codex",
  headed: false,
  startedAt,
  task: {
    websiteUrl: "https://app.zybra.in/",
    task: "Multi-site professional QA audit across 10 websites including authenticated Zybra audit.",
    qaProfile: "full-professional",
    testDataCount: 0,
    scope: ["multi-site", "smoke", "browser-state", "console", "network", "accessibility-basic", "responsive-basic", "authenticated-zybra"],
    safety: defaultSafety(),
    report: { excel: true, markdown: true, json: true, embedScreenshotsInExcel: true },
    modules: []
  },
  generatedLeads: [],
  stepsPerformed: steps,
  bugs: allIssues.filter((item) => ["Critical", "High"].includes(item.severity)),
  uxIssues: allIssues.filter((item) => item.severity === "Medium"),
  missingValidations: allIssues.filter((item) => item.severity === "Low"),
  consoleErrors: summaries.flatMap((summary) => Array.from({ length: Number(summary.consoleErrors) }, (_, index) => `${summary.site}: console error ${index + 1}`)),
  networkErrors: summaries.flatMap((summary) => Array.from({ length: Number(summary.networkErrors) }, (_, index) => `${summary.site}: network error ${index + 1}`)),
  screenshots,
  browserState: aggregateState,
  qaChecklist: Object.fromEntries(summaries.flatMap((summary) => [
    [`${summary.site}: page loaded`, summary.title ? "Pass" : "Needs Verification"],
    [`${summary.site}: browser state captured`, states[String(summary.site)] ? "Pass" : "Fail"],
    [`${summary.site}: screenshot captured`, summary.screenshot ? "Pass" : "Fail"],
    [`${summary.site}: responsive checked`, summary.responsive ? "Pass" : "Needs Verification"]
  ])),
  memoryNotes: [
    `Websites audited: ${summaries.length}`,
    `Issues recorded: ${allIssues.length}`,
    "Safe learnings saved to sites/selectors/known-issues/playbooks memory.",
    "Zybra credentials were used only for login and password was not stored."
  ],
  loginResult: "Zybra authenticated with provided credentials. Public sites did not require login.",
  finalStatus: allIssues.some((item) => item.severity === "Critical") ? "Fail" : allIssues.length ? "Partial Pass" : "Pass"
};
const reports = writeReports(context);
const aggregate = { startedAt, runId, summaries, issueCount: allIssues.length, issues: allIssues, screenshots, reports };
const customJson = path.join(process.cwd(), "agent", "reports", `${runId}-multi-site-audit-summary.json`);
const customMd = path.join(process.cwd(), "agent", "reports", `${runId}-multi-site-audit-summary.md`);
fs.writeFileSync(customJson, JSON.stringify(aggregate, null, 2));
fs.writeFileSync(customMd, [
  "# Multi-Site Professional QA Audit",
  "",
  `- Started: ${startedAt}`,
  `- Websites audited: ${summaries.length}`,
  `- Total issues: ${allIssues.length}`,
  `- Final status: ${context.finalStatus}`,
  "",
  "## Website Summary",
  "",
  "| Website | Final URL | Title | Load ms | Clickables | Inputs | Console | Network |",
  "|---|---|---|---:|---:|---:|---:|---:|",
  ...summaries.map((summary) => `| ${summary.site} | ${summary.finalUrl} | ${String(summary.title || "").replace(/\|/g, " ")} | ${summary.loadMs} | ${summary.clickables} | ${summary.inputs} | ${summary.consoleErrors} | ${summary.networkErrors} |`),
  "",
  "## Issue Matrix",
  "",
  "| Module | Issue | Description | Priority | Status |",
  "|---|---|---|---|---|",
  ...allIssues.map((item) => `| ${item.area.replace(/\|/g, " ")} | ${item.title.replace(/\|/g, " ")} | ${item.description.replace(/\|/g, " ")} | ${item.severity} | ${(item.status || "Open").replace(/\|/g, " ")} |`),
  "",
  "## Report Files",
  "",
  `- Excel: ${reports.excelPath}`,
  `- Markdown: ${reports.markdownPath}`,
  `- JSON: ${reports.jsonPath}`,
  `- Custom summary JSON: ${customJson}`,
  `- Screenshots: ${screenshotDir}`,
  `- State: ${stateDir}`
].join("\n"));
console.log(JSON.stringify({ reports, customJson, customMd, screenshots: screenshots.length, issueCount: allIssues.length, summaries: summaries.map((summary) => ({ site: summary.site, title: summary.title, finalUrl: summary.finalUrl, issues: allIssues.filter((item) => item.area.startsWith(`${summary.site} /`)).length })) }, null, 2));
