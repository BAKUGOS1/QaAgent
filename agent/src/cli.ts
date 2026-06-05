import fs from "node:fs";
import { Command } from "commander";
import { qaTaskSchema } from "./shared/task-schema.js";
import type { AgentMode, QaTask } from "./shared/types.js";
import { defaultSafety } from "./shared/safety-guard.js";

export interface CliOptions {
  mode: AgentMode;
  headed: boolean;
  task: QaTask;
  maxSteps: number;
}

export function parseCli(argv = process.argv): CliOptions {
  const program = new Command();
  program
    .option("--mode <mode>", "Agent mode: codex or groq", "codex")
    .option("--url <url>", "Website URL")
    .option("--task <task>", "QA task")
    .option("--task-file <path>", "Task JSON file")
    .option("--count <count>", "Random lead count", "3")
    .option("--headed", "Run headed browser", false)
    .option("--headless", "Run headless browser", false)
    .option("--max-steps <count>", "Max Groq tool loop steps", "50");

  program.parse(argv);
  const opts = program.opts();
  const mode = opts.mode === "groq" ? "groq" : "codex";
  const headed = Boolean(opts.headed) && !Boolean(opts.headless);

  const taskInput = opts.taskFile
    ? JSON.parse(fs.readFileSync(String(opts.taskFile), "utf8"))
    : {
        websiteUrl: opts.url,
        task: opts.task || "Run a general website QA smoke test.",
        testDataCount: Number(opts.count || 3),
        scope: ["smoke", "navigation", "console", "network"],
        safety: defaultSafety()
      };

  return {
    mode,
    headed,
    task: qaTaskSchema.parse(taskInput),
    maxSteps: Number(opts.maxSteps || 50)
  };
}
