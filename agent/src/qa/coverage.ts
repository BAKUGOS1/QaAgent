import type { BrowserState, CoverageConfidence, CoverageItem, CoverageStatus, FinalQaStatus, QaTask } from "../shared/types.js";

interface CoverageInput {
  task: QaTask;
  state?: BrowserState;
  screenshots: string[];
  stepsPerformed: string[];
  loginResult: string;
}

export function buildCoverageSummary(input: CoverageInput) {
  const items: CoverageItem[] = [
    ...loginCoverage(input),
    ...moduleCoverage(input),
    ...scopeCoverage(input)
  ];
  const modulesVisited = items.filter((item) => item.status === "Pass" || item.status === "Partial").length;
  const notTested = items.filter((item) => item.status === "Not Tested").length;
  const needsVerification = items.filter((item) => item.status === "Needs Verification").length;
  const blocked = items.filter((item) => item.status === "Blocked").length;
  const confidence = summarizeConfidence(items);

  return {
    modulesVisited,
    requiredModules: items.length,
    screenshotsCaptured: input.screenshots.length,
    actionsAttempted: input.stepsPerformed.length,
    notTested,
    needsVerification,
    blocked,
    confidence,
    notes: coverageNotes(items),
    items
  };
}

export function statusWithCoverage(
  hasIssues: boolean,
  coverage: ReturnType<typeof buildCoverageSummary>
): FinalQaStatus {
  if (coverage.blocked > 0) return "Fail";
  if (hasIssues || coverage.notTested > 0 || coverage.needsVerification > 0 || coverage.confidence !== "High") {
    return "Partial Pass";
  }
  return "Pass";
}

function loginCoverage(input: CoverageInput): CoverageItem[] {
  if (!input.task.login?.enabled) return [];
  const status = statusFromLoginResult(input.loginResult);
  return [{
    module: "Login",
    actionsAttempted: "Configured smart login with selectors/env-backed credentials.",
    evidence: input.state?.url || "No browser state captured.",
    status,
    blocker: status === "Blocked" || status === "Needs Verification" ? input.loginResult : undefined,
    confidence: status === "Pass" ? "High" : "Low"
  }];
}

function moduleCoverage(input: CoverageInput): CoverageItem[] {
  const modules = input.task.modules || [];
  if (!modules.length) return [];
  return modules.map((module) => {
    const evidence = moduleEvidence(module.name, input);
    const status: CoverageStatus = evidence ? "Partial" : "Not Tested";
    return {
      module: module.name,
      actionsAttempted: module.url || module.openSelector || module.addSelector
        ? [module.url ? `url=${module.url}` : "", module.openSelector ? `open=${module.openSelector}` : "", module.addSelector ? `add=${module.addSelector}` : ""].filter(Boolean).join("; ")
        : "Module declared but no URL/open selector was provided.",
      evidence: evidence || "No matching URL, step, or selector evidence in this run.",
      status,
      blocker: status === "Not Tested" ? "Configured module was not visited by the current deterministic run." : undefined,
      confidence: evidence ? "Medium" : "Low"
    };
  });
}

function scopeCoverage(input: CoverageInput): CoverageItem[] {
  const state = input.state;
  const scopes = input.task.scope.length ? input.task.scope : ["smoke"];
  return scopes.map((scope) => {
    const normalized = scope.toLowerCase();
    if (normalized.includes("console")) {
      return coverageItem(scope, state?.consoleErrors.length ? "Needs Verification" : "Pass", state?.consoleErrors.length ? `${state.consoleErrors.length} console errors captured.` : "No console errors captured.", input);
    }
    if (normalized.includes("network")) {
      return coverageItem(scope, state?.networkErrors.length ? "Needs Verification" : "Pass", state?.networkErrors.length ? `${state.networkErrors.length} network errors captured.` : "No network errors captured.", input);
    }
    if (normalized.includes("screenshot")) {
      return coverageItem(scope, input.screenshots.length ? "Pass" : "Not Tested", input.screenshots.at(-1) || "No screenshot captured.", input);
    }
    if (normalized.includes("navigation")) {
      const count = (state?.links.length || 0) + (state?.buttons.length || 0);
      return coverageItem(scope, count ? "Needs Verification" : "Not Tested", count ? `${count} navigable controls detected; deeper click-through still required.` : "No navigable controls detected.", input);
    }
    if (normalized.includes("login")) {
      const status = input.task.login?.enabled ? statusFromLoginResult(input.loginResult) : "Not Tested";
      return coverageItem(scope, status, input.task.login?.enabled ? input.loginResult : "Login scope requested but login config is missing.", input);
    }
    if (normalized.includes("smoke")) {
      return coverageItem(scope, state ? "Pass" : "Not Tested", state ? `Loaded ${state.url}` : "No state captured.", input);
    }
    return coverageItem(scope, "Needs Verification", "Scope was requested but no deterministic module-specific proof was collected.", input);
  });
}

function coverageItem(scope: string, status: CoverageStatus, evidence: string, input: CoverageInput): CoverageItem {
  return {
    module: titleCase(scope),
    actionsAttempted: input.stepsPerformed.length ? `${input.stepsPerformed.length} recorded steps/actions in run.` : "No explicit steps recorded.",
    evidence,
    status,
    blocker: status === "Not Tested" || status === "Blocked" ? evidence : undefined,
    confidence: confidenceForStatus(status)
  };
}

function moduleEvidence(moduleName: string, input: CoverageInput): string | undefined {
  const lowerName = moduleName.toLowerCase();
  const step = input.stepsPerformed.find((item) => item.toLowerCase().includes(lowerName));
  if (step) return step;
  const stateUrl = input.state?.url.toLowerCase() || "";
  if (stateUrl.includes(lowerName.replace(/\s+/g, "-")) || stateUrl.includes(lowerName.replace(/\s+/g, ""))) {
    return input.state?.url;
  }
  return undefined;
}

function statusFromLoginResult(loginResult: string): CoverageStatus {
  const normalized = loginResult.toLowerCase();
  if (normalized.includes("completed") || normalized.includes("pass")) return "Pass";
  if (normalized.includes("disabled") || normalized.includes("not configured")) return "Not Tested";
  if (normalized.includes("missing") || normalized.includes("failed") || normalized.includes("fail")) return "Blocked";
  return "Needs Verification";
}

function confidenceForStatus(status: CoverageStatus): CoverageConfidence {
  if (status === "Pass") return "High";
  if (status === "Partial" || status === "Needs Verification") return "Medium";
  return "Low";
}

function summarizeConfidence(items: CoverageItem[]): CoverageConfidence {
  if (!items.length) return "Low";
  if (items.some((item) => item.confidence === "Low")) return "Low";
  if (items.some((item) => item.confidence === "Medium")) return "Medium";
  return "High";
}

function coverageNotes(items: CoverageItem[]): string[] {
  const notes = [];
  if (items.some((item) => item.status === "Not Tested")) notes.push("Some requested modules/scopes were not deterministically tested.");
  if (items.some((item) => item.status === "Needs Verification")) notes.push("Some areas have signals but need deeper click-through or assertion evidence.");
  if (items.some((item) => item.status === "Blocked")) notes.push("A blocker prevented full QA coverage.");
  if (!notes.length) notes.push("Requested coverage has direct run evidence.");
  return notes;
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
