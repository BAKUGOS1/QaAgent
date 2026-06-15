import { z } from "zod";

const safetySchema = z.object({
  allowDelete: z.boolean().default(false),
  allowArchive: z.boolean().default(false),
  allowPayment: z.boolean().default(false),
  allowRealMessageSend: z.boolean().default(false),
  allowBulkUpdate: z.boolean().default(false),
  allowSettingsChange: z.boolean().default(false),
  allowSensitiveExport: z.boolean().default(false)
});

const credentialsSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  emailEnv: z.string().optional(),
  passwordEnv: z.string().optional()
}).optional();

const loginSchema = z.object({
  enabled: z.boolean().default(false),
  loginUrl: z.string().optional(),
  emailSelector: z.string().optional(),
  passwordSelector: z.string().optional(),
  submitSelector: z.string().optional(),
  successUrlIncludes: z.string().optional(),
  successTextIncludes: z.string().optional()
}).optional();

const moduleSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  openSelector: z.string().optional(),
  addSelector: z.string().optional(),
  formSelectors: z.record(z.string(), z.string()).optional()
});

const reportSchema = z.object({
  excel: z.boolean().default(true),
  markdown: z.boolean().default(false),
  json: z.boolean().default(false),
  embedScreenshotsInExcel: z.boolean().default(true)
}).default({
  excel: true,
  markdown: false,
  json: false,
  embedScreenshotsInExcel: true
});

const cypressInspiredSchema = z.object({
  defaultCommandTimeoutMs: z.number().int().min(0).max(120_000).default(4_000),
  pollIntervalMs: z.number().int().min(25).max(5_000).default(250),
  screenshotOnFailure: z.boolean().default(true),
  fixtureDir: z.string().optional()
}).optional();

const stepSchema = z.object({
  action: z.enum([
    "open",
    "click",
    "click_by_index",
    "click_by_text",
    "click_by_role",
    "fill",
    "fill_by_label",
    "fill_by_placeholder",
    "fill_by_name",
    "press",
    "wait",
    "screenshot",
    "analyze",
    "assert_visible",
    "assert_text",
    "assert_url_includes",
    "assert_count"
  ]),
  selector: z.string().optional(),
  index: z.number().int().optional(),
  role: z.string().optional(),
  text: z.string().optional(),
  value: z.string().optional(),
  expected: z.string().optional(),
  count: z.number().int().optional(),
  key: z.string().optional(),
  url: z.string().optional(),
  label: z.string().optional(),
  timeoutMs: z.number().int().min(0).max(120_000).optional(),
  fixture: z.string().optional()
});

export const qaTaskSchema = z.object({
  websiteUrl: z.string().url(),
  task: z.string().min(3),
  qaProfile: z.enum([
    "smoke",
    "functional",
    "ui-ux",
    "regression-basic",
    "accessibility-basic",
    "performance-basic",
    "security-basic",
    "full-professional"
  ]).default("full-professional"),
  testDataCount: z.number().int().min(0).max(100).default(3),
  scope: z.array(z.string()).default([]),
  credentials: credentialsSchema,
  login: loginSchema,
  modules: z.array(moduleSchema).default([]),
  report: reportSchema,
  cypress: cypressInspiredSchema,
  safety: safetySchema.default({
    allowDelete: false,
    allowArchive: false,
    allowPayment: false,
    allowRealMessageSend: false,
    allowBulkUpdate: false,
    allowSettingsChange: false,
    allowSensitiveExport: false
  }),
  steps: z.array(stepSchema).optional()
});

export type QaTaskInput = z.input<typeof qaTaskSchema>;
