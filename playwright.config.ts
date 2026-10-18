import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 90000,
  expect: { timeout: 6000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    launchOptions: { args: ["--disable-gpu"] },
    screenshot: "only-on-failure",
  },
  workers: 1,
  reporter: "list",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});
