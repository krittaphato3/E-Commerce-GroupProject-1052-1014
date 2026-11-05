import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public";

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: testDbUrl,
    },
  },
});

export async function clearTestDatabase(client: PrismaClient = testPrisma) {
  // Truncate all tables in reverse dependency order
  await client.$executeRawUnsafe(`
    TRUNCATE TABLE "OrderStatusHistory", "OrderItem", "Order", "Session", "MenuItem", "User" RESTART IDENTITY CASCADE;
  `);
}
