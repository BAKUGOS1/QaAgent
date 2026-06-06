export type RiskTier = "High" | "Medium" | "Low";

export interface RiskRule {
  tier: RiskTier;
  journey: string;
  examples: string[];
}

export const riskRules: RiskRule[] = [
  {
    tier: "High",
    journey: "Authentication and account access",
    examples: ["login", "logout", "session persistence", "protected routes"]
  },
  {
    tier: "High",
    journey: "Money, billing, payment, data loss",
    examples: ["payment", "subscription", "delete", "bulk update", "export sensitive data"]
  },
  {
    tier: "High",
    journey: "Core business create/save flows",
    examples: ["lead creation", "order creation", "invoice save", "customer update"]
  },
  {
    tier: "Medium",
    journey: "Operational productivity",
    examples: ["search", "filter", "sort", "pagination", "upload", "download"]
  },
  {
    tier: "Medium",
    journey: "Form validation and recovery",
    examples: ["required fields", "invalid data", "error toast", "retry behavior"]
  },
  {
    tier: "Low",
    journey: "Non-blocking UI polish",
    examples: ["copy", "spacing", "minor alignment", "helper text"]
  }
];

export function riskForScope(scope: string[]): RiskTier {
  const text = scope.join(" ").toLowerCase();
  if (riskRules.some((rule) => rule.tier === "High" && rule.examples.some((example) => text.includes(example)))) return "High";
  if (riskRules.some((rule) => rule.tier === "Medium" && rule.examples.some((example) => text.includes(example)))) return "Medium";
  return "Low";
}

