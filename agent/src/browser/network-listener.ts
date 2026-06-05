import type { Page } from "playwright";

export class NetworkListener {
  private readonly errors: string[] = [];

  attach(page: Page): void {
    page.on("requestfailed", (request) => {
      this.errors.push(`${request.method()} ${request.url()} failed: ${request.failure()?.errorText || "unknown"}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        this.errors.push(`${response.status()} ${response.url()}`);
      }
    });
  }

  getErrors(): string[] {
    return [...this.errors];
  }
}
