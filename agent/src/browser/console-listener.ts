import type { Page } from "playwright";

export class ConsoleListener {
  private readonly errors: string[] = [];

  attach(page: Page): void {
    page.on("console", (message) => {
      if (message.type() === "error") this.errors.push(message.text());
    });
    page.on("pageerror", (error) => this.errors.push(error.message));
  }

  getErrors(): string[] {
    return [...this.errors];
  }
}
