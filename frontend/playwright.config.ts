import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const configDir = path.dirname(fileURLToPath(import.meta.url));

// TEST-09 credentials come from backend/.env; no password is committed.
const envFile = path.resolve(configDir, "../backend/.env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

// Dedicated ports so the E2E stack does not collide with local dev servers.
const frontendPort = process.env.E2E_FRONTEND_PORT ?? "5174";
const apiPort = process.env.E2E_API_PORT ?? "3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${frontendPort}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev --prefix ../backend",
      url: `http://localhost:${apiPort}/api/health`,
      cwd: configDir,
      env: { PORT: apiPort },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${frontendPort} --strictPort`,
      url: `http://localhost:${frontendPort}`,
      cwd: configDir,
      env: { API_PROXY_TARGET: `http://localhost:${apiPort}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
