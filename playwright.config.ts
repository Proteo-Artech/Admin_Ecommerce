import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e", workers: 1, retries: process.env.CI ? 1 : 0, forbidOnly: !!process.env.CI,
  reporter: "list", use: { baseURL: "http://127.0.0.1:3201", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "node node_modules/next/dist/bin/next start -p 3201", url: "http://127.0.0.1:3201/api/health", reuseExistingServer: false },
});
