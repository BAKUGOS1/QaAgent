export type AgentMode = "codex" | "groq";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type FinalQaStatus = "Pass" | "Partial Pass" | "Fail";
export type CoverageStatus = "Pass" | "Partial" | "Blocked" | "Needs Verification" | "Not Tested";
export type CoverageConfidence = "High" | "Medium" | "Low";
export type CommandLogKind = "system" | "query" | "assertion" | "action" | "fixture";
export type CommandLogStatus = "Pass" | "Fail";
export type QaProfile =
  | "smoke"
  | "functional"
  | "ui-ux"
  | "regression-basic"
  | "accessibility-basic"
  | "performance-basic"
  | "security-basic"
  | "full-professional";

export interface CredentialsRef {
  email?: string;
  password?: string;
  emailEnv?: string;
  passwordEnv?: string;
}

export interface SafetyPermissions {
  allowDelete: boolean;
  allowArchive?: boolean;
  allowPayment: boolean;
  allowRealMessageSend: boolean;
  allowBulkUpdate: boolean;
  allowSettingsChange: boolean;
  allowSensitiveExport: boolean;
}

export interface QaTask {
  websiteUrl: string;
  task: string;
  qaProfile: QaProfile;
  testDataCount: number;
  scope: string[];
  credentials?: CredentialsRef;
  login?: LoginConfig;
  modules?: ModuleConfig[];
  report?: ReportConfig;
  safety: SafetyPermissions;
  steps?: TaskStep[];
  cypress?: CypressInspiredConfig;
}

export interface CypressInspiredConfig {
  defaultCommandTimeoutMs?: number;
  pollIntervalMs?: number;
  screenshotOnFailure?: boolean;
  fixtureDir?: string;
}

export interface LoginConfig {
  enabled: boolean;
  loginUrl?: string;
  emailSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  successUrlIncludes?: string;
  successTextIncludes?: string;
}

export interface ModuleConfig {
  name: string;
  url?: string;
  openSelector?: string;
  addSelector?: string;
  formSelectors?: Record<string, string>;
}

export interface ReportConfig {
  excel: boolean;
  markdown: boolean;
  json: boolean;
  embedScreenshotsInExcel: boolean;
}

export interface TaskStep {
  action:
    | "open"
    | "click"
    | "click_by_index"
    | "click_by_text"
    | "click_by_role"
    | "fill"
    | "fill_by_label"
    | "fill_by_placeholder"
    | "fill_by_name"
    | "press"
    | "wait"
    | "screenshot"
    | "analyze"
    | "assert_visible"
    | "assert_text"
    | "assert_url_includes"
    | "assert_count";
  selector?: string;
  index?: number;
  role?: string;
  text?: string;
  value?: string;
  expected?: string;
  count?: number;
  key?: string;
  url?: string;
  label?: string;
  timeoutMs?: number;
  fixture?: string;
}

export interface LeadData {
  name: string;
  phone: string;
  email: string;
  company: string;
  city: string;
  source: string;
  notes: string;
  status: string;
  requirement: string;
}

export interface QaIssue {
  title: string;
  severity: Severity;
  area: string;
  description: string;
  evidence?: string;
  suggestedFix?: string;
  steps?: string;
  expected?: string;
  actual?: string;
  screenshot?: string;
  developerNote?: string;
  status?: string;
}

export interface CoverageItem {
  module: string;
  actionsAttempted: string;
  evidence: string;
  status: CoverageStatus;
  blocker?: string;
  confidence: CoverageConfidence;
}

export interface CoverageSummary {
  modulesVisited: number;
  requiredModules: number;
  screenshotsCaptured: number;
  actionsAttempted: number;
  notTested: number;
  needsVerification: number;
  blocked: number;
  confidence: CoverageConfidence;
  notes: string[];
  items: CoverageItem[];
}

export interface CommandLogEntry {
  index: number;
  kind: CommandLogKind;
  name: string;
  target?: string;
  status: CommandLogStatus;
  attempts: number;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  error?: string;
  screenshotPath?: string;
}

export interface IndexedElement {
  index: number;
  tag: string;
  text: string;
  selector: string;
  role?: string;
  visible: boolean;
  enabled: boolean;
}

export interface VisibleForm {
  index: number;
  selector: string;
  fieldCount: number;
  submitLabels: string[];
}

export interface VisibleTable {
  index: number;
  selector: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
}

export interface BrowserState {
  url: string;
  title: string;
  textSample: string;
  buttons: string[];
  inputs: string[];
  links: string[];
  forms: VisibleForm[];
  tables: VisibleTable[];
  modals: string[];
  toasts: string[];
  errorMessages: string[];
  clickableElements: IndexedElement[];
  suggestedSelectors: string[];
  screenshotPath?: string;
  consoleErrors: string[];
  networkErrors: string[];
  savedAt: string;
}

export interface RunContext {
  mode: AgentMode;
  headed: boolean;
  startedAt: string;
  task: QaTask;
  generatedLeads: LeadData[];
  stepsPerformed: string[];
  bugs: QaIssue[];
  uxIssues: QaIssue[];
  missingValidations: QaIssue[];
  consoleErrors: string[];
  networkErrors: string[];
  screenshots: string[];
  tracePath?: string;
  browserState?: BrowserState;
  coverage?: CoverageSummary;
  commandLog?: CommandLogEntry[];
  qaChecklist?: Record<string, string>;
  memoryNotes?: string[];
  loginResult: string;
  finalStatus: FinalQaStatus;
}
