import type { BrowserAgent } from "./browser-agent.js";
import type { CommandLogKind, QaTask, TaskStep } from "../shared/types.js";

export interface ResolvedCypressConfig {
  defaultCommandTimeoutMs: number;
  pollIntervalMs: number;
  screenshotOnFailure: boolean;
  fixtureDir?: string;
}

interface CommandDescriptor {
  kind: CommandLogKind;
  name: string;
  target?: string;
}

interface CommandRunResult<T> {
  value: T;
  attempts: number;
}

export class CypressRetryError extends Error {
  constructor(message: string, readonly attempts: number) {
    super(message);
    this.name = "CypressRetryError";
  }
}

export function cypressConfig(task?: QaTask): ResolvedCypressConfig {
  return {
    defaultCommandTimeoutMs: task?.cypress?.defaultCommandTimeoutMs ?? 4_000,
    pollIntervalMs: task?.cypress?.pollIntervalMs ?? 250,
    screenshotOnFailure: task?.cypress?.screenshotOnFailure ?? true,
    fixtureDir: task?.cypress?.fixtureDir
  };
}

export function oneAttempt<T>(value: T): CommandRunResult<T> {
  return { value, attempts: 1 };
}

export async function retryAssertion<T>(
  browser: BrowserAgent,
  task: QaTask | undefined,
  step: TaskStep,
  assertion: () => Promise<T>
): Promise<CommandRunResult<T>> {
  const config = cypressConfig(task);
  const timeoutMs = step.timeoutMs ?? config.defaultCommandTimeoutMs;
  const deadline = Date.now() + timeoutMs;
  let attempts = 0;
  let lastError: unknown;

  do {
    attempts += 1;
    try {
      return { value: await assertion(), attempts };
    } catch (error) {
      lastError = error;
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) break;
      await browser.activePage.waitForTimeout(Math.min(config.pollIntervalMs, remainingMs));
    }
  } while (Date.now() <= deadline);

  const message = lastError instanceof Error ? lastError.message : String(lastError || "Assertion failed.");
  throw new CypressRetryError(message, attempts);
}

export async function runCypressCommand<T>(
  browser: BrowserAgent,
  task: QaTask | undefined,
  step: TaskStep,
  descriptor: CommandDescriptor,
  run: () => Promise<CommandRunResult<T>>
): Promise<T> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  let attempts = 1;

  try {
    const result = await run();
    attempts = result.attempts;
    const endedAtDate = new Date();
    browser.recorder.recordCommand({
      ...descriptor,
      target: descriptor.target || targetFromStep(step),
      status: "Pass",
      attempts,
      startedAt,
      endedAt: endedAtDate.toISOString(),
      durationMs: endedAtDate.getTime() - startedAtDate.getTime()
    });
    return result.value;
  } catch (error) {
    attempts = error instanceof CypressRetryError ? error.attempts : attempts;
    const config = cypressConfig(task);
    let screenshotPath: string | undefined;
    if (config.screenshotOnFailure) {
      screenshotPath = await browser.screenshot(`failure-${descriptor.name}`).catch(() => undefined);
    }
    const endedAtDate = new Date();
    browser.recorder.recordCommand({
      ...descriptor,
      target: descriptor.target || targetFromStep(step),
      status: "Fail",
      attempts,
      startedAt,
      endedAt: endedAtDate.toISOString(),
      durationMs: endedAtDate.getTime() - startedAtDate.getTime(),
      error: error instanceof Error ? error.message : String(error),
      screenshotPath
    });
    throw error;
  }
}

function targetFromStep(step: TaskStep): string | undefined {
  return step.selector || step.text || step.role || step.url || step.label || step.value;
}
