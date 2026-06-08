import type { QaPlaybook } from "./playbook-types.js";

export const smokePlaybook: QaPlaybook = {
  id: "smoke",
  name: "Smoke",
  profiles: ["smoke", "functional", "regression-basic", "full-professional"],
  checks: [
    {
      name: "Page loads",
      run: async (browser) => {
        const url = browser.getUrl();
        return url && url !== "about:blank" && !url.startsWith("data:") ? "Pass" : "Fail";
      }
    },
    {
      name: "No blocker console errors",
      run: async (browser) => {
        const errors = browser.getConsoleErrors();
        const blockerErrors = errors.filter(e => e.toLowerCase().includes("error") || e.toLowerCase().includes("failed"));
        return blockerErrors.length === 0 ? "Pass" : `Fail (${blockerErrors.length} console errors)`;
      }
    },
    {
      name: "No blocker network errors",
      run: async (browser) => {
        const errors = browser.getNetworkErrors();
        const blockerErrors = errors.filter(e => e.toLowerCase().includes("failed") || e.toLowerCase().includes("error"));
        return blockerErrors.length === 0 ? "Pass" : `Fail (${blockerErrors.length} network errors)`;
      }
    },
    {
      name: "Primary navigation visible",
      run: async (browser, state) => {
        const hasLinks = state ? state.links.length > 0 : (await browser.detectFormFields()).length > 0;
        return hasLinks ? "Pass" : "Needs Verification";
      }
    },
    {
      name: "Screenshot captured",
      run: async (browser, state) => {
        return state?.screenshotPath ? "Pass" : "Needs Verification";
      }
    }
  ]
};

