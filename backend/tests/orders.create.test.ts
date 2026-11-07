import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const CUSTOMER2_EMAIL = "customer2@campusbites.test";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "";

function sessionCookie(response: SupertestResponse): string | undefined {
  const raw = response.headers["set-cookie"];
  const cookies = raw ? (Array.isArray(raw) ? raw : [String(raw)]) : [];
  return cookies.find((value) => value.startsWith("cb_session="))?.split(";")[0];
}

async function loginCookie(email: string): Promise<string> {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password: CUSTOMER_PASSWORD });

  expect(response.status).toBe(200);
  const cookie = sessionCookie(response);
  expect(cookie).toBeDefined();
  return cookie as string;
}

async function menuItemId(name: string): Promise<number> {
  const item = await testPrisma.menuItem.findUniqueOrThrow({ where: { name } });
  return item.id;
}

function postOrder(cookie: string, body: unknown) {
  return request(app).post("/api/orders").set("Cookie", cookie).send(body as object);
}

describe("F-03 Order submission (AC-14 to AC-25)", () => {
  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-14: a valid order returns 201 PENDING/UNPAID and can be retrieved afterwards", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const basilId = await menuItemId("Basil Pork Rice");
    const teaId = await menuItemId("Thai Iced Tea");

    const created = await postOrder(cookie, {
      items: [
        { menuItemId: basilId, quantity: 2 },
        { menuItemId: teaId, quantity: 1 },
      ],
      pickupNote: "Pickup at 12:30",
    });

    expect(created.status).toBe(201);
    const order = created.body.order;

    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("UNPAID");
    expect(order.orderNumber).toMatch(/^CB-\d{6}$/);
    expect(order.orderNumber).toBe(`CB-${String(order.id).padStart(6, "0")}`);
    expect(order.totalSatang).toBe(15000);
    expect(order.pickupNote).toBe("Pickup at 12:30");
    expect(order.items).toHaveLength(2);

    const basilLine = order.items.find(
      (line: { menuItemId: number }) => line.menuItemId === basilId
    );
    expect(basilLine).toMatchObject({
      itemName: "Basil Pork Rice",
      unitPriceSatang: 6000,
      quantity: 2,
      lineTotalSatang: 12000,
    });

    const detail = await request(app)
      .get(`/api/orders/${order.id}`)
      .set("Cookie", cookie);

    expect(detail.status).toBe(200);
    expect(detail.body.order.totalSatang).toBe(15000);
    expect(detail.body.order.items).toEqual(order.items);
    expect(detail.body.order.status).toBe("PENDING");

    expect(await testPrisma.order.count()).toBe(1);
    expect(await testPrisma.orderItem.count()).toBe(2);
  });

  it("TEST-15: the total uses the current database price, not a client value", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const basilId = await menuItemId("Basil Pork Rice");
    const teaId = await menuItemId("Thai Iced Tea");

    await testPrisma.menuItem.update({ where: { id: basilId }, data: { priceSatang: 7000 } });

    const response = await postOrder(cookie, {
      items: [
        { menuItemId: basilId, quantity: 2 },
        { menuItemId: teaId, quantity: 1 },
      ],
    });

    expect(response.status).toBe(201);
    expect(response.body.order.totalSatang).toBe(17000);
    expect(response.body.order.items).toHaveLength(2);
  });

  it("TEST-16: client-supplied totalSatang, unitPriceSatang or status returns 400 and saves nothing", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const basilId = await menuItemId("Basil Pork Rice");
    const stockBefore = (await testPrisma.menuItem.findUniqueOrThrow({ where: { id: basilId } }))
      .stockQty;

    const bodies = [
      { items: [{ menuItemId: basilId, quantity: 1 }], totalSatang: 1 },
      { items: [{ menuItemId: basilId, quantity: 1, unitPriceSatang: 1 }] },
      { items: [{ menuItemId: basilId, quantity: 1 }], status: "ACCEPTED" },
      { items: [{ menuItemId: basilId, quantity: 1 }], customerId: 2 },
    ];

    for (const body of bodies) {
      const response = await postOrder(cookie, body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    }

    expect(await testPrisma.order.count()).toBe(0);
    expect(
      (await testPrisma.menuItem.findUniqueOrThrow({ where: { id: basilId } })).stockQty
    ).toBe(stockBefore);
  });

  it("TEST-17: existing orders keep their snapshot price after the menu price changes", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const basilId = await menuItemId("Basil Pork Rice");

    const created = await postOrder(cookie, {
      items: [{ menuItemId: basilId, quantity: 2 }],
    });
    expect(created.status).toBe(201);
    expect(created.body.order.totalSatang).toBe(12000);

    await testPrisma.menuItem.update({ where: { id: basilId }, data: { priceSatang: 9000 } });

    const detail = await request(app)
      .get(`/api/orders/${created.body.order.id}`)
      .set("Cookie", cookie);

    expect(detail.status).toBe(200);
    expect(detail.body.order.items[0]).toMatchObject({
      unitPriceSatang: 6000,
      lineTotalSatang: 12000,
    });
    expect(detail.body.order.totalSatang).toBe(12000);
  });

  it("TEST-18: invalid quantities return 400 and save nothing", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const basilId = await menuItemId("Basil Pork Rice");

    for (const quantity of [0, -1, 1.5, "2", 11]) {
      const response = await postOrder(cookie, {
        items: [{ menuItemId: basilId, quantity }],
      });

      expect(response.status, `quantity ${String(quantity)}`).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    }

    expect(await testPrisma.order.count()).toBe(0);
  });

  it("TEST-19: an empty list, more than ten lines or a duplicated item returns 400", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const seeded = await testPrisma.menuItem.findMany({ orderBy: { id: "asc" } });
    expect(seeded).toHaveLength(7);

    for (let index = 0; index < 4; index += 1) {
      await testPrisma.menuItem.create({
        data: {
          name: `Test Menu Item ${index + 1}`,
          description: "Extra item used to build an 11-line order",
          priceSatang: 1000,
          stockQty: 10,
          isAvailable: true,
        },
      });
    }

    const elevenItems = await testPrisma.menuItem.findMany({ orderBy: { id: "asc" } });
    expect(elevenItems).toHaveLength(11);

    const duplicatedId = elevenItems[0].id;
    const cases: unknown[] = [
      { items: [] },
      { items: elevenItems.map((item) => ({ menuItemId: item.id, quantity: 1 })) },
      {
        items: [
          { menuItemId: duplicatedId, quantity: 1 },
          { menuItemId: duplicatedId, quantity: 2 },
        ],
      },
      { items: [{ menuItemId: 99999, quantity: 1 }] },
    ];

    for (const body of cases) {
      const response = await postOrder(cookie, body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    }

    expect(await testPrisma.order.count()).toBe(0);
  });

  it("TEST-20: a 201-character pickup note is rejected and a 200-character note is stored", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const basilId = await menuItemId("Basil Pork Rice");

    const tooLong = await postOrder(cookie, {
      items: [{ menuItemId: basilId, quantity: 1 }],
      pickupNote: "n".repeat(201),
    });
    expect(tooLong.status).toBe(400);
    expect(tooLong.body.error.code).toBe("VALIDATION_ERROR");

    const exact = await postOrder(cookie, {
      items: [{ menuItemId: basilId, quantity: 1 }],
      pickupNote: "n".repeat(200),
    });
    expect(exact.status).toBe(201);
    expect(exact.body.order.pickupNote).toBe("n".repeat(200));

    const stored = await testPrisma.order.findUniqueOrThrow({
      where: { id: exact.body.order.id },
    });
    expect(stored.pickupNote).toBe("n".repeat(200));
  });

  it("TEST-21: ordering a sold-out or disabled item returns 409 ITEM_UNAVAILABLE with details", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const soldOutId = await menuItemId("Chicken Sandwich");
    const disabledId = await menuItemId("Pad Thai");

    const soldOut = await postOrder(cookie, {
      items: [{ menuItemId: soldOutId, quantity: 1 }],
    });
    expect(soldOut.status).toBe(409);
    expect(soldOut.body.error.code).toBe("ITEM_UNAVAILABLE");
    expect(soldOut.body.error.details).toMatchObject({
      menuItemId: soldOutId,
      requested: 1,
      available: 0,
    });

    const disabled = await postOrder(cookie, {
      items: [{ menuItemId: disabledId, quantity: 1 }],
    });
    expect(disabled.status).toBe(409);
    expect(disabled.body.error.code).toBe("ITEM_UNAVAILABLE");
    expect(disabled.body.error.details.menuItemId).toBe(disabledId);

    expect(await testPrisma.order.count()).toBe(0);
    expect(
      (await testPrisma.menuItem.findUniqueOrThrow({ where: { id: disabledId } })).stockQty
    ).toBe(20);
  });

  it("TEST-22: a failing line rolls the whole order back and leaves other stock unchanged", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const basilId = await menuItemId("Basil Pork Rice");
    const soldOutId = await menuItemId("Chicken Sandwich");

    await testPrisma.menuItem.update({ where: { id: basilId }, data: { stockQty: 3 } });

    const tooMany = await postOrder(cookie, {
      items: [{ menuItemId: basilId, quantity: 4 }],
    });
    expect(tooMany.status).toBe(409);
    expect(tooMany.body.error.code).toBe("ITEM_UNAVAILABLE");

    const mixed = await postOrder(cookie, {
      items: [
        { menuItemId: basilId, quantity: 1 },
        { menuItemId: soldOutId, quantity: 1 },
      ],
    });
    expect(mixed.status).toBe(409);
    expect(mixed.body.error.code).toBe("ITEM_UNAVAILABLE");

    expect(
      (await testPrisma.menuItem.findUniqueOrThrow({ where: { id: basilId } })).stockQty
    ).toBe(3);
    expect(await testPrisma.order.count()).toBe(0);
    expect(await testPrisma.orderItem.count()).toBe(0);
  });

  it("TEST-23: a successful order reduces stock by exactly the ordered quantity", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const basilId = await menuItemId("Basil Pork Rice");

    const response = await postOrder(cookie, {
      items: [{ menuItemId: basilId, quantity: 2 }],
    });

    expect(response.status).toBe(201);
    expect(
      (await testPrisma.menuItem.findUniqueOrThrow({ where: { id: basilId } })).stockQty
    ).toBe(28);
  });

  it("TEST-24: two customers ordering the last unit produce exactly one 201 and one 409", async () => {
    const cookieOne = await loginCookie(CUSTOMER1_EMAIL);
    const cookieTwo = await loginCookie(CUSTOMER2_EMAIL);
    const lastUnitId = await menuItemId("Mango Sticky Rice");

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await testPrisma.orderStatusHistory.deleteMany();
      await testPrisma.orderItem.deleteMany();
      await testPrisma.order.deleteMany();
      await testPrisma.menuItem.update({
        where: { id: lastUnitId },
        data: { stockQty: 1, isAvailable: true },
      });

      const body = { items: [{ menuItemId: lastUnitId, quantity: 1 }] };
      const [first, second] = await Promise.all([
        postOrder(cookieOne, body),
        postOrder(cookieTwo, body),
      ]);

      const statuses = [first.status, second.status].sort((a, b) => a - b);
      expect(statuses, `attempt ${attempt + 1}`).toEqual([201, 409]);

      const rejected = first.status === 409 ? first : second;
      expect(rejected.body.error.code).toBe("ITEM_UNAVAILABLE");

      expect(
        (await testPrisma.menuItem.findUniqueOrThrow({ where: { id: lastUnitId } })).stockQty
      ).toBe(0);
      expect(
        await testPrisma.orderItem.count({ where: { menuItemId: lastUnitId } })
      ).toBe(1);
    }
  });

  it("TEST-25: creating an order writes exactly one history entry with a timestamp", async () => {
    const cookie = await loginCookie(CUSTOMER1_EMAIL);
    const customer = await testPrisma.user.findUniqueOrThrow({
      where: { email: CUSTOMER1_EMAIL },
    });
    const basilId = await menuItemId("Basil Pork Rice");

    const created = await postOrder(cookie, {
      items: [{ menuItemId: basilId, quantity: 1 }],
    });
    expect(created.status).toBe(201);

    const history = await testPrisma.orderStatusHistory.findMany({
      where: { orderId: created.body.order.id },
    });

    expect(history).toHaveLength(1);
    expect(history[0].fromStatus).toBeNull();
    expect(history[0].toStatus).toBe("PENDING");
    expect(history[0].actorRole).toBe("CUSTOMER");
    expect(history[0].actorId).toBe(customer.id);
    expect(history[0].createdAt).toBeInstanceOf(Date);
    expect(history[0].createdAt.getTime()).not.toBeNaN();
    expect(history[0].createdAt.getTime()).toBeLessThanOrEqual(Date.now());

    const detail = await request(app)
      .get(`/api/orders/${created.body.order.id}`)
      .set("Cookie", cookie);

    expect(detail.status).toBe(200);
    expect(detail.body.order.history).toHaveLength(1);
    expect(detail.body.order.history[0]).toMatchObject({
      fromStatus: null,
      toStatus: "PENDING",
      actorRole: "CUSTOMER",
    });
    expect(typeof detail.body.order.history[0].createdAt).toBe("string");
    expect(Number.isNaN(Date.parse(detail.body.order.history[0].createdAt))).toBe(false);
    expect(Date.parse(detail.body.order.history[0].createdAt)).toBeLessThanOrEqual(Date.now());
  });
});
