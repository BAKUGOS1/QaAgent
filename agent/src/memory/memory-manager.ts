import path from "node:path";
import { readJsonFile, writeJsonFile } from "../shared/utils.js";

export class MemoryManager<T> {
  constructor(private readonly fileName: string, private readonly fallback: T) {}

  get filePath(): string {
    return path.join(process.cwd(), "agent", "memory", this.fileName);
  }

  read(): T {
    return readJsonFile<T>(this.filePath, this.fallback);
  }

  write(value: T): void {
    writeJsonFile(this.filePath, value);
  }
}
