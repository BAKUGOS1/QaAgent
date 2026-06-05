import type { SafetyPermissions } from "./types.js";

const destructivePatterns = [
  { key: "allowDelete", pattern: /\b(delete|remove|drop|destroy)\b/i },
  { key: "allowPayment", pattern: /\b(pay|payment|charge|checkout|purchase)\b/i },
  { key: "allowRealMessageSend", pattern: /\b(send|sms|whatsapp|email|broadcast)\b/i },
  { key: "allowBulkUpdate", pattern: /\b(bulk|mass update|import all)\b/i },
  { key: "allowSettingsChange", pattern: /\b(settings|change password|account setting)\b/i },
  { key: "allowSensitiveExport", pattern: /\b(export|download customer|dump)\b/i }
] as const;

export function assertSafeAction(label: string, safety: SafetyPermissions): void {
  for (const rule of destructivePatterns) {
    if (rule.pattern.test(label) && !safety[rule.key]) {
      throw new Error("Blocked by safety guard.");
    }
  }
}

export function defaultSafety(): SafetyPermissions {
  return {
    allowDelete: false,
    allowPayment: false,
    allowRealMessageSend: false,
    allowBulkUpdate: false,
    allowSettingsChange: false,
    allowSensitiveExport: false
  };
}
