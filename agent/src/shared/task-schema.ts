import { z } from "zod";

const safetySchema = z.object({
  allowDelete: z.boolean().default(false),
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

const stepSchema = z.object({
  action: z.enum(["open", "click", "fill", "press", "wait", "screenshot", "analyze"]),
  selector: z.string().optional(),
  value: z.string().optional(),
  key: z.string().optional(),
  url: z.string().optional(),
  label: z.string().optional()
});

export const qaTaskSchema = z.object({
  websiteUrl: z.string().url(),
  task: z.string().min(3),
  testDataCount: z.number().int().min(0).max(100).default(3),
  scope: z.array(z.string()).default([]),
  credentials: credentialsSchema,
  safety: safetySchema.default({
    allowDelete: false,
    allowPayment: false,
    allowRealMessageSend: false,
    allowBulkUpdate: false,
    allowSettingsChange: false,
    allowSensitiveExport: false
  }),
  steps: z.array(stepSchema).optional()
});

export type QaTaskInput = z.input<typeof qaTaskSchema>;
