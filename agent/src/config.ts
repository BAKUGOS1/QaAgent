import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

for (const file of [".env.local", ".env"]) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false, quiet: true });
}

export interface AppConfig {
  groqApiKey?: string;
  groqModel: string;
  groqFallbackModel: string;
  testEmail?: string;
  testPassword?: string;
  headless: boolean;
}

export function loadConfig(): AppConfig {
  return {
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    groqFallbackModel: process.env.GROQ_FALLBACK_MODEL || "openai/gpt-oss-20b",
    testEmail: process.env.TEST_EMAIL,
    testPassword: process.env.TEST_PASSWORD,
    headless: (process.env.HEADLESS || "true").toLowerCase() !== "false"
  };
}
