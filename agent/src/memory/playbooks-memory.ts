import { MemoryManager } from "./memory-manager.js";

export const playbooksMemory = new MemoryManager<Record<string, string[]>>("playbooks.json", {});

