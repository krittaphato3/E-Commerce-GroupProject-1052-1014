/**
 * Resets the E2E database before every Playwright run (TEST-09, 12, 29, 41, 42).
 *
 * Applies migrations, truncates every table and re-seeds with the passwords from
 * `backend/.env`, so a run never inherits state from `npm test` or a previous
 * E2E run. It refuses to touch anything whose database name does not end with
 * `_test`.
 */
import dotenv from "dotenv";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public";

/** Mirrors `backend/tests/setup.ts`: never point this script at a real database. */
export function assertTestDatabaseUrl(databaseUrl: string): string {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to reset database "${databaseName}": the test database name must end with "_test".`
    );
  }

  return databaseUrl;
}

function loadBackendEnv(): void {
  // npm runs a workspace script from the workspace folder, but also accept a
  // run from the repository root.
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "backend/.env"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
  }
}

async function main(): Promise<void> {
  loadBackendEnv();

  const testDatabaseUrl = assertTestDatabaseUrl(
    process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL
  );

  // Point the application's Prisma client at the test database before any
  // module below creates one.
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.TEST_DATABASE_URL = testDatabaseUrl;

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  });

  const { clearTestDatabase } = await import("../tests/helpers/testDb.js");
  const { seedDatabase } = await import("../prisma/seed.js");
  const { prisma } = await import("../src/db/prisma.js");

  try {
    await clearTestDatabase(prisma);
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }

  console.log("[E2E] Test database reset and seeded.");
}

main().catch((error) => {
  console.error("[E2E] Failed to reset the test database:", error);
  process.exit(1);
});
