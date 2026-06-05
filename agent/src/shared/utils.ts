import fs from "node:fs";
import path from "node:path";

export const rootDir = process.cwd();

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJsonFile(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function timestampForFile(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + `-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

export function sanitizeSecret(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.replace(/./g, "*");
}

export function shortText(value: string, max = 4000): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}
