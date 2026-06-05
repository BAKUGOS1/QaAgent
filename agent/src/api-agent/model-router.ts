import type { AppConfig } from "../config.js";

export function selectGroqModels(config: AppConfig): { main: string; fallback: string; optional: string } {
  return {
    main: config.groqModel,
    fallback: config.groqFallbackModel,
    optional: "qwen/qwen3-32b"
  };
}
