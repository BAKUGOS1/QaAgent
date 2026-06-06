import fs from "node:fs";
import path from "node:path";
import type { RunContext } from "../shared/types.js";
import { ensureDir, timestampForFile } from "../shared/utils.js";
import { renderJsonReport } from "./json.js";
import { renderMarkdownReport } from "./markdown.js";
import { writeExcelReport } from "./excel.js";

export interface WrittenReports {
  markdownPath?: string;
  jsonPath?: string;
  excelPath?: string;
}

export function writeReports(context: RunContext): WrittenReports {
  const dir = path.join(process.cwd(), "agent", "reports");
  ensureDir(dir);
  const base = `${timestampForFile()}-agent-report`;
  const reports: WrittenReports = {};
  const reportConfig = context.task.report || { excel: true, markdown: false, json: false, embedScreenshotsInExcel: true };
  if (reportConfig.markdown) {
    reports.markdownPath = path.join(dir, `${base}.md`);
    fs.writeFileSync(reports.markdownPath, renderMarkdownReport(context));
  }
  if (reportConfig.json) {
    reports.jsonPath = path.join(dir, `${base}.json`);
    fs.writeFileSync(reports.jsonPath, renderJsonReport(context));
  }
  if (reportConfig.excel) {
    reports.excelPath = path.join(dir, `${base}.xlsx`);
    writeExcelReport(context, reports.excelPath);
  }
  return reports;
}
