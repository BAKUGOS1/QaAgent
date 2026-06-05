import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "agent/tests",
  timeout: 60_000,
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
