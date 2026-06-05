import fs from "node:fs";
import path from "node:path";
import type { RunContext } from "../shared/types.js";
import { ensureDir, timestampForFile } from "../shared/utils.js";
import { renderJsonReport } from "./json.js";
import { renderMarkdownReport } from "./markdown.js";

export interface WrittenReports {
  markdownPath: string;
  jsonPath: string;
}

export function writeReports(context: RunContext): WrittenReports {
  const dir = path.join(process.cwd(), "agent", "reports");
  ensureDir(dir);
  const base = `${timestampForFile()}-agent-report`;
  const markdownPath = path.join(dir, `${base}.md`);
  const jsonPath = path.join(dir, `${base}.json`);
  fs.writeFileSync(markdownPath, renderMarkdownReport(context));
  fs.writeFileSync(jsonPath, renderJsonReport(context));
  return { markdownPath, jsonPath };
}
