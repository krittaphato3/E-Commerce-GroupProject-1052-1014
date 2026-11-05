import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

describe("TEST-45: Seed idempotency & repeatability (AC-45, NFR-08)", () => {
  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("Running the seed twice leaves exactly 4 users and 7 menu items without duplicates or errors", async () => {
    // First run on empty database
    await seedDatabase(testPrisma);

    const usersAfterFirst = await testPrisma.user.count();
    const menuItemsAfterFirst = await testPrisma.menuItem.count();

    expect(usersAfterFirst).toBe(4);
    expect(menuItemsAfterFirst).toBe(7);

    // Second run immediately on already-seeded database (testing idempotency)
    await expect(seedDatabase(testPrisma)).resolves.not.toThrow();

    const usersAfterSecond = await testPrisma.user.count();
    const menuItemsAfterSecond = await testPrisma.menuItem.count();

    expect(usersAfterSecond).toBe(4);
    expect(menuItemsAfterSecond).toBe(7);

    // Check specific required seed properties
    const soldOutItem = await testPrisma.menuItem.findUnique({
      where: { name: "Chicken Sandwich" },
    });
    expect(soldOutItem).not.toBeNull();
    expect(soldOutItem?.stockQty).toBe(0);
    expect(soldOutItem?.isAvailable).toBe(true);

    const delistedItem = await testPrisma.menuItem.findUnique({
      where: { name: "Pad Thai" },
    });
    expect(delistedItem).not.toBeNull();
    expect(delistedItem?.isAvailable).toBe(false);

    const customer1 = await testPrisma.user.findUnique({
      where: { email: "customer1@campusbites.test" },
    });
    expect(customer1).not.toBeNull();
    expect(customer1?.role).toBe("CUSTOMER");
    expect(customer1?.passwordHash).not.toBe("customer123!"); // Must be bcrypt hash
  });
});
