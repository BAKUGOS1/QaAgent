import type { BrowserAgent } from "../browser/browser-agent.js";
import { runTaskStep } from "../browser/actions.js";
import type { QaTask } from "../shared/types.js";
import { assertSafeAction } from "../shared/safety-guard.js";

export async function runExplicitTaskSteps(browser: BrowserAgent, task: QaTask): Promise<string[]> {
  const screenshots: string[] = [];
  for (const step of task.steps || []) {
    assertSafeAction(`${step.action} ${step.label || step.selector || step.value || ""}`, task.safety);
    const screenshot = await runTaskStep(browser, step);
    if (screenshot) screenshots.push(screenshot);
  }
  return screenshots;
}
