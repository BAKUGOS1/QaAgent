import fs from "node:fs";
import path from "node:path";
import { ensureDir } from "./utils.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private logFile?: string;

  constructor() {
    if (process.env.LOG_FILE) {
      const logFilePath = path.resolve(process.env.LOG_FILE);
      ensureDir(path.dirname(logFilePath));
      this.logFile = logFilePath;
    }
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const formatted = this.formatMessage(level, message, meta);

    const colors = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m",  // Green
      warn: "\x1b[33m",  // Yellow
      error: "\x1b[31m"  // Red
    };
    const reset = "\x1b[0m";

    if (level === "error") {
      console.error(`${colors[level]}${formatted}${reset}`);
    } else if (level === "warn") {
      console.warn(`${colors[level]}${formatted}${reset}`);
    } else {
      console.log(`${colors[level]}${formatted}${reset}`);
    }

    if (this.logFile) {
      try {
        fs.appendFileSync(
          this.logFile,
          `${JSON.stringify({ timestamp: new Date().toISOString(), level, message, meta })}\n`
        );
      } catch {
        // Fallback silently if file write fails
      }
    }
  }

  debug(message: string, meta?: any): void {
    if (process.env.DEBUG === "true" || process.env.LOG_LEVEL === "debug") {
      this.log("debug", message, meta);
    }
  }

  info(message: string, meta?: any): void {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log("warn", message, meta);
  }

  error(message: string, errorOrMessage: any, meta?: any): void {
    const errMessage = errorOrMessage instanceof Error ? errorOrMessage.message : String(errorOrMessage);
    const stack = errorOrMessage instanceof Error ? { stack: errorOrMessage.stack } : {};
    this.log("error", message, { error: errMessage, ...stack, ...meta });
  }
}

export const logger = new Logger();
export default logger;
