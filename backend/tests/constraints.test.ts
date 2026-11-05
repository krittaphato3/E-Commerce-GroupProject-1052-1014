import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { Role, OrderStatus, PaymentStatus } from "@prisma/client";

describe("TEST-46: Database constraints (AC-46, BR-13)", () => {
  let initialUserId: number;
  let initialItemId: number;
  let initialOrderId: number;

  beforeEach(async () => {
    await clearTestDatabase(testPrisma);

    // Seed baseline valid user, item, and order
    const user = await testPrisma.user.create({
      data: {
        email: "alice@campus.local",
        displayName: "Alice",
        passwordHash: "$2a$10$validhashedpasswordplaceholder",
        role: Role.CUSTOMER,
      },
    });
    initialUserId = user.id;

    const item = await testPrisma.menuItem.create({
      data: {
        name: "Standard Fried Rice",
        description: "Standard fried rice",
        priceSatang: 5000,
        stockQty: 20,
        isAvailable: true,
      },
    });
    initialItemId = item.id;

    const order = await testPrisma.order.create({
      data: {
        customerId: user.id,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        totalSatang: 5000,
        items: {
          create: {
            menuItemId: item.id,
            itemName: item.name,
            unitPriceSatang: item.priceSatang,
            quantity: 1,
            lineTotalSatang: 5000,
          },
        },
      },
    });
    initialOrderId = order.id;
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("1. Rejects a menu price of 0 or below (CHECK priceSatang > 0)", async () => {
    const initialCount = await testPrisma.menuItem.count();

    await expect(
      testPrisma.$executeRawUnsafe(`
        INSERT INTO "MenuItem" ("name", "description", "priceSatang", "stockQty", "isAvailable", "updatedAt")
        VALUES ('Zero Price Food', 'Test', 0, 10, true, NOW());
      `)
    ).rejects.toThrow();

    await expect(
      testPrisma.$executeRawUnsafe(`
        INSERT INTO "MenuItem" ("name", "description", "priceSatang", "stockQty", "isAvailable", "updatedAt")
        VALUES ('Negative Price Food', 'Test', -500, 10, true, NOW());
      `)
    ).rejects.toThrow();

    expect(await testPrisma.menuItem.count()).toBe(initialCount);
  });

  it("2. Rejects negative stock insertion (CHECK stockQty >= 0)", async () => {
    const initialCount = await testPrisma.menuItem.count();

    await expect(
      testPrisma.$executeRawUnsafe(`
        INSERT INTO "MenuItem" ("name", "description", "priceSatang", "stockQty", "isAvailable", "updatedAt")
        VALUES ('Negative Stock Food', 'Test', 4000, -1, true, NOW());
      `)
    ).rejects.toThrow();

    expect(await testPrisma.menuItem.count()).toBe(initialCount);
  });

  it("3. Rejects updating stock below 0 (CHECK stockQty >= 0)", async () => {
    await expect(
      testPrisma.$executeRawUnsafe(`
        UPDATE "MenuItem" SET "stockQty" = -1 WHERE "id" = ${initialItemId};
      `)
    ).rejects.toThrow();

    const item = await testPrisma.menuItem.findUnique({
      where: { id: initialItemId },
    });
    expect(item?.stockQty).toBe(20);
  });

  it("4. Rejects order line quantity of 0 (CHECK quantity 1..10)", async () => {
    const initialItemCount = await testPrisma.orderItem.count();

    await expect(
      testPrisma.$executeRawUnsafe(`
        INSERT INTO "OrderItem" ("orderId", "menuItemId", "itemName", "unitPriceSatang", "quantity", "lineTotalSatang")
        VALUES (${initialOrderId}, ${initialItemId}, 'Zero Quantity', 5000, 0, 0);
      `)
    ).rejects.toThrow();

    expect(await testPrisma.orderItem.count()).toBe(initialItemCount);
  });

  it("5. Rejects order line quantity of 11 (CHECK quantity 1..10)", async () => {
    const initialItemCount = await testPrisma.orderItem.count();

    await expect(
      testPrisma.$executeRawUnsafe(`
        INSERT INTO "OrderItem" ("orderId", "menuItemId", "itemName", "unitPriceSatang", "quantity", "lineTotalSatang")
        VALUES (${initialOrderId}, ${initialItemId}, 'Over Quantity', 5000, 11, 55000);
      `)
    ).rejects.toThrow();

    expect(await testPrisma.orderItem.count()).toBe(initialItemCount);
  });

  it("6. Rejects duplicate item in one order (UNIQUE orderId, menuItemId)", async () => {
    const initialItemCount = await testPrisma.orderItem.count();

    // initialOrderId already has initialItemId
    await expect(
      testPrisma.$executeRawUnsafe(`
        INSERT INTO "OrderItem" ("orderId", "menuItemId", "itemName", "unitPriceSatang", "quantity", "lineTotalSatang")
        VALUES (${initialOrderId}, ${initialItemId}, 'Duplicate Item', 5000, 2, 10000);
      `)
    ).rejects.toThrow();

    expect(await testPrisma.orderItem.count()).toBe(initialItemCount);
  });

  it("7. Rejects duplicate user email (UNIQUE email)", async () => {
    const initialUserCount = await testPrisma.user.count();

    await expect(
      testPrisma.$executeRawUnsafe(`
        INSERT INTO "User" ("email", "displayName", "passwordHash", "role")
        VALUES ('alice@campus.local', 'Duplicate Alice', 'anotherhash', 'CUSTOMER');
      `)
    ).rejects.toThrow();

    expect(await testPrisma.user.count()).toBe(initialUserCount);
  });
});
