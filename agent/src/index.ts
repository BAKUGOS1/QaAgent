import { loadConfig } from "./config.js";
import { parseCli } from "./cli.js";
import { runCodexDriver } from "./codex-agent/codex-driver.js";
import { runGroqToolLoop } from "./api-agent/groq-tool-loop.js";

async function main(): Promise<void> {
  const options = parseCli();
  const config = loadConfig();
  const result = options.mode === "groq"
    ? await runGroqToolLoop(options.task, options.headed, options.maxSteps, config)
    : await runCodexDriver(options.task, options.headed);

  console.log("\nQA run complete.");
  console.log(`Markdown report: ${result.reports.markdownPath}`);
  console.log(`JSON report: ${result.reports.jsonPath}`);
  console.log(`Final status: ${result.context.finalStatus}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
