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

// The whole E2E run uses the test database, never the development database.
// `globalSetup` truncates and re-seeds it after the API has started.
const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public";
const e2eDatabaseUrl = process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL;

if (!new URL(e2eDatabaseUrl).pathname.replace(/^\//, "").endsWith("_test")) {
  throw new Error(
    `Refusing to run E2E against "${e2eDatabaseUrl}": the test database name must end with "_test".`
  );
}

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
      // Migrations must exist before server.ts runs its startup session cleanup.
      command: "npm run db:migrate:test --prefix ../backend && npm run dev --prefix ../backend",
      url: `http://localhost:${apiPort}/api/health`,
      cwd: configDir,
      env: {
        PORT: apiPort,
        DATABASE_URL: e2eDatabaseUrl,
        TEST_DATABASE_URL: e2eDatabaseUrl,
      },
      reuseExistingServer: false,
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
