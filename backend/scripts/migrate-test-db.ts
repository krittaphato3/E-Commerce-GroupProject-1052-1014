import dotenv from "dotenv";
import { execSync } from "node:child_process";

dotenv.config();

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required to migrate the test database");
}

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
});
