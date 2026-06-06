import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert";
import { loadConfig } from "../src/config.js";
import { GroqClient } from "../src/api-agent/groq-client.js";
import { runCodexDriver } from "../src/codex-agent/codex-driver.js";
import { defaultSafety, assertSafeAction } from "../src/shared/safety-guard.js";
import { createRandomLeadData } from "../src/data/lead-data.js";
import { writeExcelReport } from "../src/reports/excel.js";
import type { QaTask, RunContext } from "../src/shared/types.js";

async function main(): Promise<void> {
  const config = loadConfig();
  assert.equal(typeof config.groqModel, "string");

  const originalKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  const missingKeyClient = new GroqClient(loadConfig());
  assert.throws(() => missingKeyClient.assertReady(), /GROQ_API_KEY is missing/);
  if (originalKey) process.env.GROQ_API_KEY = originalKey;

  const task: QaTask = {
    websiteUrl: "https://example.com",
    task: "Smoke test homepage and generate report.",
    qaProfile: "smoke",
    testDataCount: 1,
    scope: ["smoke", "navigation", "console", "network", "screenshot"],
    safety: defaultSafety(),
    report: { excel: true, markdown: true, json: true, embedScreenshotsInExcel: true },
    modules: [],
    steps: [
      { action: "screenshot", label: "smoke-home" },
      { action: "analyze", label: "smoke-state" }
    ]
  };

  const result = await runCodexDriver(task, false);
  assert.ok(result.reports.markdownPath, "markdown path missing");
  assert.ok(result.reports.jsonPath, "json path missing");
  assert.ok(result.reports.excelPath, "excel path missing");
  assert.ok(fs.existsSync(result.reports.markdownPath), "markdown report missing");
  assert.ok(fs.existsSync(result.reports.jsonPath), "json report missing");
  assert.ok(fs.existsSync(result.reports.excelPath), "excel report missing");
  assert.ok(result.context.screenshots.length >= 1, "screenshot not captured");
  assert.ok(result.context.tracePath && fs.existsSync(result.context.tracePath), "trace not captured");
  assert.ok(result.context.coverage?.items.length, "coverage summary missing");
  assert.ok(fs.existsSync("agent/artifacts/state/latest-browser-state.json"), "browser state missing");
  assert.ok(result.context.browserState?.clickableElements.length !== undefined, "clickable index missing");

  const excelBytes = fs.readFileSync(result.reports.excelPath, "utf8");
  assert.ok(excelBytes.includes("Bug Report"), "user-facing bug report sheet missing from excel");
  assert.ok(excelBytes.includes("Coverage"), "coverage sheet missing from excel");
  assert.ok(excelBytes.includes("xl/media/"), "embedded screenshot media missing from excel");
  assert.ok(excelBytes.includes("xl/styles.xml"), "excel styles missing");
  assert.ok(excelBytes.includes("customWidth=\"1\""), "excel column widths missing");
  assert.ok(excelBytes.includes("state=\"frozen\""), "excel frozen header missing");
  assert.ok(excelBytes.includes(" s=\"1\""), "excel header style missing");
  const multilineExcelPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "qa-agent-smoke-")), "multiline.xlsx");
  const multilineContext: RunContext = {
    mode: "codex",
    headed: false,
    startedAt: new Date().toISOString(),
    task,
    generatedLeads: [],
    stepsPerformed: [],
    bugs: [{
      title: "Some lead conditions do not persist",
      severity: "High",
      area: "Lead Module",
      description: "Result: 1/5 lead conditions saved.\nPassed:\n1. Tag/source/owner - saved and searchable.\nFailed:\n1. Minimal contact fields - not searchable after Save."
    }],
    uxIssues: [],
    missingValidations: [],
    consoleErrors: [],
    networkErrors: [],
    screenshots: [],
    loginResult: "Not required",
    finalStatus: "Partial Pass"
  };
  writeExcelReport(multilineContext, multilineExcelPath);
  const multilineExcelBytes = fs.readFileSync(multilineExcelPath, "utf8");
  assert.ok(multilineExcelBytes.includes("Result: 1/5 lead conditions saved.\nPassed:"), "multiline descriptions must keep line breaks");

  const excelOnlyTask: QaTask = {
    ...task,
    task: "Smoke test Excel-only report config.",
    report: { excel: true, markdown: false, json: false, embedScreenshotsInExcel: true }
  };
  const excelOnlyResult = await runCodexDriver(excelOnlyTask, false);
  assert.ok(excelOnlyResult.reports.excelPath, "excel-only path missing");
  assert.ok(fs.existsSync(excelOnlyResult.reports.excelPath), "excel-only report missing");
  assert.equal(excelOnlyResult.reports.markdownPath, undefined);
  assert.equal(excelOnlyResult.reports.jsonPath, undefined);

  assert.throws(() => assertSafeAction("delete customer", defaultSafety()), /Blocked by safety guard/);
  assert.throws(() => assertSafeAction("payment checkout", defaultSafety()), /Blocked by safety guard/);
  assert.throws(() => assertSafeAction("send whatsapp", defaultSafety()), /Blocked by safety guard/);

  const lead = createRandomLeadData();
  for (const key of ["name", "phone", "email", "company", "city", "source", "status", "requirement", "notes"] as const) {
    assert.ok(lead[key], `lead ${key} missing`);
  }
  assert.ok(lead.notes.includes("This is QA test lead generated by local agent."));

  console.log("Smoke tests passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
