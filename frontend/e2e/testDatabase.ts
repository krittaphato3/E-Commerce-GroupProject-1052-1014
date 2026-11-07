/**
 * Shared test-database guard for the Playwright layer (DEC-26).
 *
 * `playwright.config.ts` and `e2e/globalSetup.ts` both import this module so the
 * `_test` suffix check exists once. `backend/scripts/reset-test-db.ts` and
 * `backend/tests/setup.ts` keep their own copy because they run inside the
 * backend workspace; keep the message wording in sync when this changes.
 */
export const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public";

/**
 * Refuses any database whose name does not end with `_test`.
 *
 * `action` only shapes the error message, so each caller still reads naturally.
 */
export function assertTestDatabaseUrl(
  databaseUrl: string,
  action = "run E2E against"
): string {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to ${action} database "${databaseName}": the test database name must end with "_test".`
    );
  }

  return databaseUrl;
}
