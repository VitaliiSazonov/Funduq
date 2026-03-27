import { defineConfig, devices } from "@playwright/test";

/**
 * Funduq E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./playwright/e2e",

  /* Run tests sequentially; the booking flow test has ordering requirements */
  fullyParallel: false,

  /* Retries for CI stability */
  retries: process.env.CI ? 1 : 0,

  /* Single worker — critical-path flow must run in order */
  workers: 1,

  /* Reporter — HTML report on failure, console output always */
  reporter: [["html", { open: "never" }], ["list"]],

  /* Shared settings for all projects */
  use: {
    baseURL: "http://localhost:3000",

    /* Capture screenshot on failure */
    screenshot: "only-on-failure",

    /* Collect trace on failure for debugging */
    trace: "on-first-retry",

    /* Sensible default timeout for actions */
    actionTimeout: 15_000,
  },

  /* Global timeout per test — booking flow has multiple steps */
  timeout: 120_000,

  /* Auth setup must run before the critical-flows project */
  projects: [
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      testDir: "./playwright",
    },
    {
      name: "critical-flows",
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["auth-setup"],
    },
  ],
});
