import dotenv from "dotenv";
import { randomBytes } from "node:crypto";

dotenv.config();

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public";

export function assertTestDatabaseUrl(databaseUrl: string): string {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against database "${databaseName}": the test database name must end with "_test".`
    );
  }

  return databaseUrl;
}

const testDatabaseUrl = assertTestDatabaseUrl(
  process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL
);

// The application's Prisma client reads DATABASE_URL, so point it at the test
// database before any module creates a client. Runtime code is unchanged.
process.env.DATABASE_URL = testDatabaseUrl;

// bcrypt cost 4 keeps the API tests fast; production and development use BCRYPT_ROUNDS.
process.env.BCRYPT_ROUNDS = "4";

// Seed passwords are generated per run so no password literal exists in the repo.
process.env.SEED_CUSTOMER_PASSWORD = randomBytes(18).toString("base64url");
process.env.SEED_OPERATOR_PASSWORD = randomBytes(18).toString("base64url");
