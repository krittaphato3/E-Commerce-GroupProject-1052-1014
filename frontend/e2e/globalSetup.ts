/**
 * Playwright global setup.
 *
 * The whole E2E stack runs against `TEST_DATABASE_URL` (database name `*_test`),
 * never the development database. Playwright starts `webServer` before this
 * hook, so migrations are applied by the webServer command and this hook then
 * truncates and re-seeds the same database with the passwords from
 * `backend/.env`. No test worker has started yet, so the reset cannot race a
 * request.
 *
 * Consequence: `npm test` and `npm run e2e` must never run concurrently, since
 * both own the test database.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public";

function assertTestDatabaseUrl(databaseUrl: string): string {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to run E2E against database "${databaseName}": the test database name must end with "_test".`
    );
  }

  return databaseUrl;
}

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
