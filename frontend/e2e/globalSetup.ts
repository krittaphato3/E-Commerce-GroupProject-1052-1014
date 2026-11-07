/**
 * Playwright global setup.
 *
 * The whole E2E stack runs against `TEST_DATABASE_URL` (database name `*_test`),
 * never the development database.
 *
 * This hook is the single owner of database migrations and seed state: it runs
 * `db:reset:test`, which applies `prisma migrate deploy`, truncates every table
 * and re-seeds with the passwords from `backend/.env`. The `webServer` command
 * deliberately does not migrate, so exactly one migration step runs per run.
 *
 * Playwright starts `webServer` before this hook, so the API process is already
 * listening. That is safe: `/api/health` does not query the database, and no test
 * worker starts until this hook finishes. No request can race the reset.
 *
 * Consequence: `npm test` and `npm run e2e` must never run concurrently, since
 * both own the test database.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertTestDatabaseUrl, DEFAULT_TEST_DATABASE_URL } from "./testDatabase";

export default function globalSetup(): void {
  const configDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(configDir, "../..");

  const envFile = path.resolve(repoRoot, "backend/.env");
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }

  const e2eDatabaseUrl = assertTestDatabaseUrl(
    process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL
  );

  execFileSync("npm", ["run", "db:reset:test", "--workspace=backend"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: e2eDatabaseUrl,
      TEST_DATABASE_URL: e2eDatabaseUrl,
    },
  });
}
