import type { Page } from "playwright";

export interface ApiResponse {
  url: string;
  status: number;
  body: string;
}

export class NetworkListener {
  private readonly errors: string[] = [];
  private readonly apiResponses: ApiResponse[] = [];

  attach(page: Page): void {
    page.on("requestfailed", (request) => {
      this.errors.push(`${request.method()} ${request.url()} failed: ${request.failure()?.errorText || "unknown"}`);
    });
    page.on("response", async (response) => {
      if (response.status() >= 400) {
        this.errors.push(`${response.status()} ${response.url()}`);
      }
      // Capture API response bodies for toast-vs-API verification
      const url = response.url();
      if (url.includes("/api/") || url.includes("/graphql") || url.includes("/v1/") || url.includes("/v2/")) {
        const contentType = response.headers()["content-type"] || "";
        if (contentType.includes("json") || contentType.includes("text")) {
          const body = await response.text().catch(() => "");
          if (body.length < 10_000) {
            this.apiResponses.push({
              url,
              status: response.status(),
              body: body.slice(0, 2000)
            });
          }
        }
      }
    });
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  getApiResponses(): ApiResponse[] {
    return [...this.apiResponses].slice(-50);
  }
}
