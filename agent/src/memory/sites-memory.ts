import { MemoryManager } from "./memory-manager.js";

export interface SiteMemory {
  knownPages?: string[];
  previousBugs?: string[];
  usefulNotes?: string[];
  lastRunSummary?: string;
}

export const sitesMemory = new MemoryManager<Record<string, SiteMemory>>("sites.json", {});
