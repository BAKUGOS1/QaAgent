import fs from "node:fs";
import path from "node:path";
import type { RunContext } from "../shared/types.js";
import { ensureDir, timestampForFile } from "../shared/utils.js";
import { renderJsonReport } from "./json.js";
import { renderMarkdownReport } from "./markdown.js";
import { writeExcelReport } from "./excel.js";

export interface WrittenReports {
  markdownPath: string;
  jsonPath: string;
  excelPath: string;
}

export function writeReports(context: RunContext): WrittenReports {
  const dir = path.join(process.cwd(), "agent", "reports");
  ensureDir(dir);
  const base = `${timestampForFile()}-agent-report`;
  const markdownPath = path.join(dir, `${base}.md`);
  const jsonPath = path.join(dir, `${base}.json`);
  const excelPath = path.join(dir, `${base}.xlsx`);
  fs.writeFileSync(markdownPath, renderMarkdownReport(context));
  fs.writeFileSync(jsonPath, renderJsonReport(context));
  writeExcelReport(context, excelPath);
  return { markdownPath, jsonPath, excelPath };
}
