/**
 * Guards against drift among the three `_test` database-name guard copies (DEC-26).
 *
 * A single cross-workspace runtime module is impractical here: backend scripts run
 * under `tsx` inside the backend workspace, while the Playwright E2E layer must not
 * import backend runtime code. Each copy therefore carries a "keep in sync" note:
 * - `backend/tests/setup.ts`
 * - `backend/scripts/reset-test-db.ts`
 * - `frontend/e2e/testDatabase.ts`
 *
 * This test inspects the three source files directly (no database connection or
 * environment dependency) and fails with a file-specific message if any copy's
 * pathname check, error message tail, or default test database URL literal drifts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testsDir, "../..");

const GUARD_FILES = [
  "backend/tests/setup.ts",
  "backend/scripts/reset-test-db.ts",
  "frontend/e2e/testDatabase.ts",
] as const;

const EXPECTED_PATHNAME_EXTRACTION = 'new URL(databaseUrl).pathname.replace(/^\\//, "")';
const EXPECTED_SUFFIX_GUARD = 'databaseName.endsWith("_test")';
const EXPECTED_MESSAGE_TAIL = 'the test database name must end with "_test"';
const EXPECTED_DEFAULT_URL =
  "postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public";

describe("_test database-guard synchronization", () => {
  it("keeps the three _test database-guard copies in sync (setup.ts, reset-test-db.ts, e2e/testDatabase.ts)", () => {
    for (const relativePath of GUARD_FILES) {
      const absolutePath = path.resolve(repoRoot, relativePath);
      const source = readFileSync(absolutePath, "utf8");

      expect(
        source,
        `${relativePath} must extract the database name from new URL(databaseUrl).pathname`
      ).toContain(EXPECTED_PATHNAME_EXTRACTION);

      expect(
        source,
        `${relativePath} must apply endsWith("_test") to the URL pathname`
      ).toContain(EXPECTED_SUFFIX_GUARD);

      expect(
        source,
        `${relativePath} must include the shared error message tail: ${EXPECTED_MESSAGE_TAIL}`
      ).toContain(EXPECTED_MESSAGE_TAIL);

      expect(
        source,
        `${relativePath} must define the canonical DEFAULT_TEST_DATABASE_URL literal`
      ).toContain(EXPECTED_DEFAULT_URL);
    }
  });
});
