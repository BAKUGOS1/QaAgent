import type { SafetyPermissions } from "./types.js";

/**
 * Tools that are always safe to call regardless of arguments.
 * These tools only observe, navigate, or produce artifacts — they never
 * modify, delete, export, send messages, or change settings.
 */
const safeToolNames = new Set([
  "open_url",
  "get_browser_state",
  "get_page_state",
  "get_page_text",
  "get_console_errors",
  "get_network_errors",
  "click_by_index",
  "click_by_text",
  "click_by_role",
  "click_selector",
  "click",
  "fill_selector",
  "fill_input",
  "fill_by_label",
  "fill_by_placeholder",
  "fill_by_name",
  "press_key",
  "wait",
  "wait_for_navigation",
  "take_screenshot",
  "screenshot",
  "analyze",
  "create_random_lead_data",
  "generate_test_data",
  "generate_report",
  "remember_site_note",
  "scroll",
  "scroll_page",
  "select_option",
  "hover"
]);

/**
 * Destructive patterns that apply ONLY to action names/labels,
 * NOT to data values being typed into form fields.
 */
const destructivePatterns = [
  { key: "allowDelete", pattern: /\b(delete|remove|drop|destroy)\b/i },
  { key: "allowArchive", pattern: /\b(archive)\b/i },
  { key: "allowPayment", pattern: /\b(pay|payment|charge|checkout|purchase)\b/i },
  { key: "allowRealMessageSend", pattern: /\b(broadcast|mass.?send|send.?sms|send.?whatsapp|send.?email|send.?message)\b/i },
  { key: "allowBulkUpdate", pattern: /\b(bulk|mass.?update|import.?all|bulk.?update)\b/i },
  { key: "allowSettingsChange", pattern: /\b(settings|change.?password|account.?setting|billing|subscription|invite.?user)\b/i },
  { key: "allowSensitiveExport", pattern: /\b(export.?customer|dump|sensitive.?export)\b/i }
] as const;

/**
 * Asserts that an action is safe to execute.
 *
 * The guard uses a two-tier approach:
 * 1. If the tool name is in the safe whitelist → always allowed (data payloads are irrelevant).
 * 2. Otherwise, check the action label against destructive patterns.
 *
 * This prevents false positives from data values like "test@email.com" triggering
 * the "send email" pattern when the tool is just `fill_input`.
 */
export function assertSafeAction(label: string, safety: SafetyPermissions): void {
  // Extract the tool/action name (first word before any space/args)
  const toolName = label.split(/\s+/)[0]?.toLowerCase() || "";

  // If it's a known safe tool, allow unconditionally
  if (safeToolNames.has(toolName)) return;

  // For unknown/custom tools, check the action label against destructive patterns
  for (const rule of destructivePatterns) {
    if (rule.pattern.test(label) && !safety[rule.key]) {
      throw new Error(`Blocked by safety guard: ${rule.key} is not allowed.`);
    }
  }
}

/**
 * Check only the action intent (e.g. button text, page context) without
 * including form data values. Use this when you want to guard against
 * clicking destructive buttons.
 */
export function assertSafeIntent(actionDescription: string, safety: SafetyPermissions): void {
  for (const rule of destructivePatterns) {
    if (rule.pattern.test(actionDescription) && !safety[rule.key]) {
      throw new Error(`Blocked by safety guard: ${rule.key} is not allowed.`);
    }
  }
}

export function defaultSafety(): SafetyPermissions {
  return {
    allowDelete: false,
    allowArchive: false,
    allowPayment: false,
    allowRealMessageSend: false,
    allowBulkUpdate: false,
    allowSettingsChange: false,
    allowSensitiveExport: false
  };
}
