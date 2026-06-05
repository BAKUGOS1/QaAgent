import fs from "node:fs";
import path from "node:path";
import { ensureDir, timestampForFile } from "./utils.js";

export class Logger {
  readonly logFile: string;

  constructor(prefix = "agent") {
    const dir = path.join(process.cwd(), "agent", "artifacts", "logs");
    ensureDir(dir);
    this.logFile = path.join(dir, `${timestampForFile()}-${prefix}.log`);
  }

  info(message: string): void {
    this.write("INFO", message);
  }

  warn(message: string): void {
    this.write("WARN", message);
  }

  error(message: string): void {
    this.write("ERROR", message);
  }

  private write(level: string, message: string): void {
    const line = `[${new Date().toISOString()}] ${level} ${message}`;
    fs.appendFileSync(this.logFile, `${line}\n`);
    console.log(line);
  }
}
