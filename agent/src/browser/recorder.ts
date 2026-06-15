import type { CommandLogEntry } from "../shared/types.js";

export class Recorder {
  private readonly steps: string[] = [];
  private readonly commands: CommandLogEntry[] = [];

  record(step: string): void {
    this.steps.push(step);
  }

  recordCommand(command: Omit<CommandLogEntry, "index">): void {
    const entry = {
      ...command,
      index: this.commands.length + 1
    };
    this.commands.push(entry);
    const attempts = entry.attempts > 1 ? ` after ${entry.attempts} attempts` : "";
    this.record(`${entry.status}: ${entry.kind} ${entry.name}${entry.target ? ` (${entry.target})` : ""}${attempts}`);
  }

  all(): string[] {
    return [...this.steps];
  }

  commandLog(): CommandLogEntry[] {
    return [...this.commands];
  }
}
