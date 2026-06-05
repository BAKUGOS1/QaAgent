export class Recorder {
  private readonly steps: string[] = [];

  record(step: string): void {
    this.steps.push(step);
  }

  all(): string[] {
    return [...this.steps];
  }
}
