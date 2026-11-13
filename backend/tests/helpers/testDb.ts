import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../src/db/prisma.js";

export const testPrisma = prisma;

export async function clearTestDatabase(client: PrismaClient = testPrisma) {
  // Truncate all tables in reverse dependency order
  await client.$executeRawUnsafe(`
    TRUNCATE TABLE "OrderStatusHistory", "OrderItem", "Order", "Session", "MenuItem", "User" RESTART IDENTITY CASCADE;
  `);
}
