import type { BrowserAgent } from "./browser-agent.js";
import type { LeadData } from "../shared/types.js";

export interface SmartFormFillResult {
  fieldsDetected: string[];
  fieldsFilled: string[];
  requiredMissing: string[];
  unsupportedFields: string[];
}

const leadFieldMap: Array<{ key: keyof LeadData; patterns: RegExp[] }> = [
  { key: "name", patterns: [/name/i, /contact/i, /lead/i] },
  { key: "phone", patterns: [/phone/i, /mobile/i, /tel/i] },
  { key: "email", patterns: [/email/i, /mail/i] },
  { key: "company", patterns: [/company/i, /business/i, /organization/i] },
  { key: "city", patterns: [/city/i] },
  { key: "source", patterns: [/source/i, /channel/i] },
  { key: "status", patterns: [/status/i, /stage/i] },
  { key: "requirement", patterns: [/requirement/i, /need/i] },
  { key: "notes", patterns: [/note/i, /description/i, /comment/i] }
];

export async function smartFillLeadForm(browser: BrowserAgent, lead: LeadData): Promise<SmartFormFillResult> {
  const state = await browser.saveBrowserState();
  const result: SmartFormFillResult = {
    fieldsDetected: state.inputs,
    fieldsFilled: [],
    requiredMissing: [],
    unsupportedFields: []
  };
  for (const input of state.inputs) {
    const match = leadFieldMap.find((field) => field.patterns.some((pattern) => pattern.test(input)));
    if (!match) {
      result.unsupportedFields.push(input);
      continue;
    }
    const value = String(lead[match.key] || "");
    if (!value) continue;
    try {
      await browser.fillByName(input, value);
      result.fieldsFilled.push(input);
    } catch {
      try {
        await browser.fillByPlaceholder(input, value);
        result.fieldsFilled.push(input);
      } catch {
        result.requiredMissing.push(input);
      }
    }
  }
  return result;
}

