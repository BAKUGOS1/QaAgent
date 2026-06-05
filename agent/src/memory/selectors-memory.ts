import { MemoryManager } from "./memory-manager.js";

export const selectorsMemory = new MemoryManager<Record<string, Record<string, string>>>("selectors.json", {});
