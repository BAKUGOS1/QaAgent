import fs from "node:fs";
import path from "node:path";
import type { QaTask } from "../shared/types.js";

const FIXTURE_PREFIX = "fixture:";

export function resolveStepValue(value: string | undefined, task?: QaTask): string {
  if (!value) return "";
  if (!value.startsWith(FIXTURE_PREFIX)) return value;
  const resolved = loadFixtureValue(value.slice(FIXTURE_PREFIX.length), task?.cypress?.fixtureDir);
  if (typeof resolved === "string") return resolved;
  if (typeof resolved === "number" || typeof resolved === "boolean") return String(resolved);
  return JSON.stringify(resolved);
}

export function loadFixtureValue(reference: string, fixtureDir?: string): unknown {
  const trimmed = reference.trim();
  if (!trimmed) throw new Error("Fixture reference is empty.");

  const [fileToken, ...pathTokens] = trimmed.split(".");
  const fileName = fileToken.endsWith(".json") ? fileToken : `${fileToken}.json`;
  const root = path.resolve(process.cwd(), fixtureDir || path.join("agent", "fixtures"));
  const fixturePath = path.resolve(root, fileName);

  if (!fixturePath.startsWith(`${root}${path.sep}`) && fixturePath !== root) {
    throw new Error(`Fixture reference escapes fixture directory: ${reference}`);
  }
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture not found: ${fixturePath}`);
  }

  let value: unknown = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  for (const token of pathTokens) {
    if (!token) continue;
    if (Array.isArray(value) && /^\d+$/.test(token)) {
      value = value[Number(token)];
      continue;
    }
    if (value && typeof value === "object" && token in value) {
      value = (value as Record<string, unknown>)[token];
      continue;
    }
    throw new Error(`Fixture path not found: ${reference}`);
  }
  return value;
}
