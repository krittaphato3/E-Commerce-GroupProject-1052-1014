import { describe, it, expect, beforeEach, afterAll, afterEach, vi } from "vitest";
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
    const seedCustomerPassword = process.env.SEED_CUSTOMER_PASSWORD;
    expect(seedCustomerPassword).toBeTruthy();
    expect(customer1?.passwordHash).not.toBe(seedCustomerPassword); // Must be a bcrypt hash
    expect(customer1?.passwordHash.startsWith("$2")).toBe(true);
  });
});

describe("Demo seed switch (SEED_DEMO_DATA)", () => {
  it("defaults to on outside production and off in production, with an explicit override", async () => {
    const { isDemoSeedEnabled } = await import("../prisma/seed.js");

    expect(isDemoSeedEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isDemoSeedEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isDemoSeedEnabled({ NODE_ENV: "production", SEED_DEMO_DATA: "true" })).toBe(true);
    expect(isDemoSeedEnabled({ NODE_ENV: "development", SEED_DEMO_DATA: "false" })).toBe(false);
  });
});

describe("Seed is safe to re-run on every deploy", () => {
  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("re-running the seed never changes an existing user's password hash", async () => {
    await seedDatabase(testPrisma, { demo: true });
    const before = await testPrisma.user.findMany({ orderBy: { email: "asc" } });

    vi.stubEnv("SEED_CUSTOMER_PASSWORD", "a-different-customer-password");
    vi.stubEnv("SEED_OPERATOR_PASSWORD", "a-different-operator-password");
    await seedDatabase(testPrisma, { demo: true });
    const after = await testPrisma.user.findMany({ orderBy: { email: "asc" } });

    expect(after).toHaveLength(before.length);
    expect(after.map((u) => u.passwordHash)).toEqual(before.map((u) => u.passwordHash));
  });

  it("production with demo off still creates the operator but skips demo customers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SEED_DEMO_DATA", "");
    vi.stubEnv("SEED_CUSTOMER_PASSWORD", "");

    await seedDatabase(testPrisma);

    const users = await testPrisma.user.findMany();
    expect(users.map((u) => u.email)).toEqual(["operator1@campusbites.test"]);
    expect(users[0].role).toBe("OPERATOR");
    expect(users[0].passwordHash.startsWith("$2")).toBe(true);
    expect(await testPrisma.order.count()).toBe(0);
  });

  it("production refuses a missing or placeholder operator password", async () => {
    vi.stubEnv("NODE_ENV", "production");

    vi.stubEnv("SEED_OPERATOR_PASSWORD", "");
    await expect(seedDatabase(testPrisma, { demo: false })).rejects.toThrow(/SEED_OPERATOR_PASSWORD/);

    vi.stubEnv("SEED_OPERATOR_PASSWORD", "change-me-local");
    await expect(seedDatabase(testPrisma, { demo: false })).rejects.toThrow(/placeholder/);
    expect(await testPrisma.user.count()).toBe(0);
  });
});
