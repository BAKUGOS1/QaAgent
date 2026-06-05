import { MemoryManager } from "./memory-manager.js";

export interface TestHistoryEntry {
  websiteUrl: string;
  mode: string;
  date: string;
  status: string;
  reportMarkdown: string;
  reportJson: string;
}

export const testHistory = new MemoryManager<TestHistoryEntry[]>("test-history.json", []);
