export type AgentMode = "codex" | "groq";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type FinalQaStatus = "Pass" | "Partial Pass" | "Fail";

export interface CredentialsRef {
  email?: string;
  password?: string;
  emailEnv?: string;
  passwordEnv?: string;
}

export interface SafetyPermissions {
  allowDelete: boolean;
  allowPayment: boolean;
  allowRealMessageSend: boolean;
  allowBulkUpdate: boolean;
  allowSettingsChange: boolean;
  allowSensitiveExport: boolean;
}

export interface QaTask {
  websiteUrl: string;
  task: string;
  testDataCount: number;
  scope: string[];
  credentials?: CredentialsRef;
  safety: SafetyPermissions;
  steps?: TaskStep[];
}

export interface TaskStep {
  action: "open" | "click" | "fill" | "press" | "wait" | "screenshot" | "analyze";
  selector?: string;
  value?: string;
  key?: string;
  url?: string;
  label?: string;
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
}

export interface BrowserState {
  url: string;
  title: string;
  textSample: string;
  buttons: string[];
  inputs: string[];
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
  loginResult: string;
  finalStatus: FinalQaStatus;
}
