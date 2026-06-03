import { defineConfig, devices } from "@playwright/test";
import { E2E_PORTAL_SECRET, E2E_PORTAL_LOGIN_URL } from "./e2e/auth-constants";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /home\.spec\.ts/,
    },
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "groups-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      testMatch: /.*groups.*\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "groups-member",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/member.json",
      },
      testMatch: /.*groups.*\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "home-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      testMatch: /home-dashboard\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "home-member",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/member.json",
      },
      testMatch: /home-dashboard-member\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "authenticated-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      testMatch: /user-menu|sidebar|navigation|search/,
      dependencies: ["setup"],
    },
    {
      name: "authenticated-member",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/member.json",
      },
      testMatch: /user-menu|sidebar|navigation|search/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      PRFC_PORTAL_SECRET: E2E_PORTAL_SECRET,
      PRFC_PORTAL_LOGIN_URL: E2E_PORTAL_LOGIN_URL,
    },
  },
});
