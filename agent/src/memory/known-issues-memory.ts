import { MemoryManager } from "./memory-manager.js";

export interface KnownIssueMemory {
  title: string;
  module: string;
  priority: string;
  status: string;
  lastSeenAt: string;
}

export const knownIssuesMemory = new MemoryManager<Record<string, KnownIssueMemory[]>>("known-issues.json", {});

