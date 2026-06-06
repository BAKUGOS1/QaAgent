export interface FlakyRule {
  signal: string;
  mitigation: string;
}

export const flakyRules: FlakyRule[] = [
  {
    signal: "Fails only with fixed time waits",
    mitigation: "Replace timeout waits with locator visibility, response, or URL assertions."
  },
  {
    signal: "Passes locally but fails in headless mode",
    mitigation: "Capture trace/screenshot, check viewport and animation timing, then quarantine until stable."
  },
  {
    signal: "Network-dependent timing varies",
    mitigation: "Wait for specific API response or UI state instead of networkidle alone."
  },
  {
    signal: "Shared test data causes order-dependent failures",
    mitigation: "Use unique generated test data and clean only test-created records when allowed."
  }
];

