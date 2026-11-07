import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { assertTestDatabaseUrl, DEFAULT_TEST_DATABASE_URL } from "./e2e/testDatabase";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "..");

// TEST-09 credentials come from backend/.env; no password is committed.
const envFile = path.resolve(repoRoot, "backend/.env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

// Dedicated ports so the E2E stack does not collide with local dev servers.
const frontendPort = process.env.E2E_FRONTEND_PORT ?? "5174";
const apiPort = process.env.E2E_API_PORT ?? "3100";

// The whole E2E run uses the test database, never the development database.
const e2eDatabaseUrl = assertTestDatabaseUrl(
  process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL
);

export default defineConfig({
  testDir: "./e2e",
  // The journeys share one database and one seeded catalog, so they must not
  // overlap: serial workers keep the seed stock deterministic (DEC-26).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  globalSetup: "./e2e/globalSetup.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${frontendPort}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Migrations and seeding run once in `e2e/globalSetup.ts` (single owner).
      // Nesting them here would apply them twice per run. The API can start on an
      // unmigrated database because `/api/health` never touches the database, and
      // globalSetup finishes before the first test executes.
      command: "npm run dev --workspace=backend",
      url: `http://localhost:${apiPort}/api/health`,
      cwd: repoRoot,
      env: {
        PORT: apiPort,
        DATABASE_URL: e2eDatabaseUrl,
        TEST_DATABASE_URL: e2eDatabaseUrl,
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // Intentionally stays relative to `frontend/` so Vite receives its local flags directly.
      command: `npm run dev -- --port ${frontendPort} --strictPort`,
      url: `http://localhost:${frontendPort}`,
      cwd: configDir,
      env: { API_PROXY_TARGET: `http://localhost:${apiPort}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
