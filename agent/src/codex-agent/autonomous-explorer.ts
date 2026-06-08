import type { BrowserAgent } from "../browser/browser-agent.js";
import type { BrowserState, QaIssue, SafetyPermissions } from "../shared/types.js";
import { assertSafeIntent } from "../shared/safety-guard.js";
import { detectIssues } from "../qa/issue-detector.js";

export interface ExplorerConfig {
  maxPages: number;
  maxDepth: number;
  safety: SafetyPermissions;
  scope: string[];
}

export interface ExplorerResult {
  pagesVisited: string[];
  screenshots: string[];
  bugs: QaIssue[];
  uxIssues: QaIssue[];
  missingValidations: QaIssue[];
  stepsPerformed: string[];
  statesCollected: BrowserState[];
}

const DEFAULT_CONFIG: ExplorerConfig = {
  maxPages: 8,
  maxDepth: 2,
  safety: {
    allowDelete: false,
    allowArchive: false,
    allowPayment: false,
    allowRealMessageSend: false,
    allowBulkUpdate: false,
    allowSettingsChange: false,
    allowSensitiveExport: false
  },
  scope: []
};

/**
 * Autonomous page explorer for Codex mode.
 * 
 * After the initial page load and explicit task steps, this module:
 * 1. Discovers navigation items (sidebar, navbar, tabs)
 * 2. Navigates through discovered links (respecting safety)
 * 3. At each new page: captures state, runs detectors, takes screenshots
 * 4. Auto-detects forms and reports basic structural issues
 * 5. Tracks visited URLs to avoid loops
 */
export async function runAutonomousExplorer(
  browser: BrowserAgent,
  config: Partial<ExplorerConfig> = {}
): Promise<ExplorerResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const visited = new Set<string>();
  const result: ExplorerResult = {
    pagesVisited: [],
    screenshots: [],
    bugs: [],
    uxIssues: [],
    missingValidations: [],
    stepsPerformed: [],
    statesCollected: []
  };

  const startUrl = normalizeUrl(browser.getUrl());
  visited.add(startUrl);
  result.pagesVisited.push(startUrl);

  await exploreCurrentPage(browser, cfg, visited, result, 0);

  return result;
}

async function exploreCurrentPage(
  browser: BrowserAgent,
  config: ExplorerConfig,
  visited: Set<string>,
  result: ExplorerResult,
  depth: number
): Promise<void> {
  if (result.pagesVisited.length >= config.maxPages) return;
  if (depth > config.maxDepth) return;

  // Capture current page state and run detectors
  const state = await browser.saveBrowserState();
  result.statesCollected.push(state);

  const detected = detectIssues(state, browser.getConsoleErrors(), browser.getNetworkErrors());
  result.bugs.push(...detected.bugs);
  result.uxIssues.push(...detected.uxIssues);
  result.missingValidations.push(...detected.missingValidations);
  result.stepsPerformed.push(`Explored: ${state.url} (${state.title || "no title"})`);

  // Try to discover navigable links within the same origin
  const currentOrigin = getOrigin(browser.getUrl());
  const candidateLinks = state.clickableElements.filter((el) => {
    if (el.role !== "link" && el.tag !== "a") return false;
    if (!el.text || el.text.length < 2) return false;
    // Skip external links, login/logout, and destructive-sounding links
    const text = el.text.toLowerCase();
    if (text.includes("logout") || text.includes("sign out") || text.includes("log out")) return false;
    if (text.includes("delete") || text.includes("remove") || text.includes("archive")) return false;
    if (text.includes("settings") || text.includes("billing") || text.includes("payment")) return false;
    return true;
  });

  // Also look for nav buttons (sidebar items, tab switches)
  const candidateButtons = state.clickableElements.filter((el) => {
    if (el.role !== "button" && el.tag !== "button") return false;
    if (!el.text || el.text.length < 2 || el.text.length > 60) return false;
    const text = el.text.toLowerCase();
    // Likely navigation: tabs, sidebar items, menu items
    if (text.includes("delete") || text.includes("remove") || text.includes("save")) return false;
    if (text.includes("submit") || text.includes("cancel") || text.includes("close")) return false;
    if (text.includes("logout") || text.includes("sign out")) return false;
    return true;
  });

  // Prioritize links over buttons, limit candidates
  const candidates = [...candidateLinks.slice(0, 6), ...candidateButtons.slice(0, 3)];

  for (const candidate of candidates) {
    if (result.pagesVisited.length >= config.maxPages) break;

    // Safety check on the link text
    try {
      assertSafeIntent(candidate.text, config.safety);
    } catch {
      result.stepsPerformed.push(`Skipped (safety): "${candidate.text}"`);
      continue;
    }

    const previousUrl = browser.getUrl();

    try {
      // Try clicking the navigation element
      await browser.click(candidate.selector);
      await browser.wait(1000);

      const newUrl = normalizeUrl(browser.getUrl());

      // Check if we actually navigated
      if (newUrl !== normalizeUrl(previousUrl) && !visited.has(newUrl)) {
        // Verify we're still on the same origin
        const newOrigin = getOrigin(browser.getUrl());
        if (newOrigin !== currentOrigin) {
          result.stepsPerformed.push(`Skipped external navigation: ${browser.getUrl()}`);
          await browser.openUrl(previousUrl);
          continue;
        }

        visited.add(newUrl);
        result.pagesVisited.push(newUrl);
        result.stepsPerformed.push(`Navigated to: ${newUrl} via "${candidate.text}"`);

        // Take a screenshot at the new page
        const screenshotPath = await browser.screenshot(`explore-${result.pagesVisited.length}`);
        result.screenshots.push(screenshotPath);

        // Recursively explore the new page
        await exploreCurrentPage(browser, config, visited, result, depth + 1);

        // Navigate back
        try {
          await browser.openUrl(previousUrl);
          await browser.wait(500);
        } catch {
          result.stepsPerformed.push(`Could not navigate back to ${previousUrl}`);
        }
      } else if (newUrl === normalizeUrl(previousUrl)) {
        // Click didn't navigate — may have opened a modal/drawer
        const postClickState = await browser.saveBrowserState();
        if (postClickState.modals.length > 0 || postClickState.toasts.length > 0) {
          result.stepsPerformed.push(`Clicked "${candidate.text}" — opened modal/drawer`);
          const modalDetected = detectIssues(postClickState, browser.getConsoleErrors(), browser.getNetworkErrors());
          result.uxIssues.push(...modalDetected.uxIssues);
          result.missingValidations.push(...modalDetected.missingValidations);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.stepsPerformed.push(`Click failed on "${candidate.text}": ${errorMessage}`);
      // Try to recover by going back to previous URL
      try {
        if (normalizeUrl(browser.getUrl()) !== normalizeUrl(previousUrl)) {
          await browser.openUrl(previousUrl);
        }
      } catch {
        // Can't recover, stop exploring from this branch
        break;
      }
    }
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash and hash
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}${parsed.search}`;
  } catch {
    return url;
  }
}

function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}
