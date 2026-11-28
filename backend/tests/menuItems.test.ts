import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const OPERATOR1_EMAIL = "operator1@campusbites.test";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "";
const OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD ?? "";

function sessionCookie(response: SupertestResponse): string | undefined {
  const raw = response.headers["set-cookie"];
  const cookies = raw ? (Array.isArray(raw) ? raw : [String(raw)]) : [];
  return cookies.find((value) => value.startsWith("cb_session="))?.split(";")[0];
}

async function loginCookie(email: string, password: string): Promise<string> {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  const cookie = sessionCookie(response);
  expect(cookie).toBeDefined();
  return cookie as string;
}

describe("F-05 Catalog Management (AC-47 to AC-55)", () => {
  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-47: POST /api/menu-items creates item with default isAvailable=true and appears in GET /api/menu", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);

    const res = await request(app)
      .post("/api/menu-items")
      .set("Cookie", operatorCookie)
      .send({
        name: "Iced Coffee",
        description: "Cold brew with milk",
        priceSatang: 3500,
        stockQty: 20,
      });

    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({
      name: "Iced Coffee",
      description: "Cold brew with milk",
      priceSatang: 3500,
      stockQty: 20,
      isAvailable: true,
      available: true,
    });
    expect(typeof res.body.item.id).toBe("number");

    const dbItem = await testPrisma.menuItem.findUniqueOrThrow({
      where: { id: res.body.item.id },
    });
    expect(dbItem).toMatchObject({
      name: "Iced Coffee",
      description: "Cold brew with milk",
      priceSatang: 3500,
      stockQty: 20,
      isAvailable: true,
    });

    const menuRes = await request(app).get("/api/menu");
    expect(menuRes.status).toBe(200);
    const listed = menuRes.body.items.find((i: { id: number }) => i.id === res.body.item.id);
    expect(listed).toMatchObject({
      id: res.body.item.id,
      name: "Iced Coffee",
      available: true,
    });
  });

  it("TEST-48: PATCH /api/menu-items/:id updates only sent fields and persists to DB and GET /api/menu", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const item1 = await testPrisma.menuItem.findFirstOrThrow({ orderBy: { id: "asc" } });

    const firstPatch = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .set("Cookie", operatorCookie)
      .send({ description: "Updated description", stockQty: 42 });

    expect(firstPatch.status).toBe(200);
    expect(firstPatch.body.item).toMatchObject({
      id: item1.id,
      name: item1.name,
      description: "Updated description",
      priceSatang: item1.priceSatang,
      stockQty: 42,
      isAvailable: item1.isAvailable,
    });

    const secondPatch = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .set("Cookie", operatorCookie)
      .send({ name: "Renamed Item", priceSatang: 7500 });

    expect(secondPatch.status).toBe(200);
    expect(secondPatch.body.item).toMatchObject({
      id: item1.id,
      name: "Renamed Item",
      description: "Updated description",
      priceSatang: 7500,
      stockQty: 42,
      isAvailable: item1.isAvailable,
    });

    const dbItem = await testPrisma.menuItem.findUniqueOrThrow({ where: { id: item1.id } });
    expect(dbItem).toMatchObject({
      name: "Renamed Item",
      description: "Updated description",
      priceSatang: 7500,
      stockQty: 42,
    });

    const menuRes = await request(app).get("/api/menu");
    const listed = menuRes.body.items.find((i: { id: number }) => i.id === item1.id);
    expect(listed).toMatchObject({
      name: "Renamed Item",
      description: "Updated description",
      priceSatang: 7500,
      stockQty: 42,
    });
  });

  it("TEST-49: disabling stops new orders with 409 ITEM_UNAVAILABLE, price patch preserves disabled, re-enabling allows orders", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const item1 = await testPrisma.menuItem.findFirstOrThrow({ orderBy: { id: "asc" } });

    const disableRes = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .set("Cookie", operatorCookie)
      .send({ isAvailable: false });
    expect(disableRes.status).toBe(200);
    expect(disableRes.body.item.available).toBe(false);

    const menuRes = await request(app).get("/api/menu");
    const listed = menuRes.body.items.find((i: { id: number }) => i.id === item1.id);
    expect(listed.available).toBe(false);

    const blockedOrder = await request(app)
      .post("/api/orders")
      .set("Cookie", customerCookie)
      .send({ items: [{ menuItemId: item1.id, quantity: 1 }] });
    expect(blockedOrder.status).toBe(409);
    expect(blockedOrder.body.error.code).toBe("ITEM_UNAVAILABLE");

    const pricePatch = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .set("Cookie", operatorCookie)
      .send({ priceSatang: 8800 });
    expect(pricePatch.status).toBe(200);
    expect(pricePatch.body.item.isAvailable).toBe(false);

    const enableRes = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .set("Cookie", operatorCookie)
      .send({ isAvailable: true });
    expect(enableRes.status).toBe(200);
    expect(enableRes.body.item.available).toBe(true);

    const allowedOrder = await request(app)
      .post("/api/orders")
      .set("Cookie", customerCookie)
      .send({ items: [{ menuItemId: item1.id, quantity: 1 }] });
    expect(allowedOrder.status).toBe(201);
  });

  it("TEST-50: editing item price and name does not change existing order snapshots (BR-04)", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const item1 = await testPrisma.menuItem.findFirstOrThrow({ orderBy: { id: "asc" } });
    const originalName = item1.name;
    const originalPrice = item1.priceSatang;

    const oldOrderRes = await request(app)
      .post("/api/orders")
      .set("Cookie", customerCookie)
      .send({ items: [{ menuItemId: item1.id, quantity: 2 }] });
    expect(oldOrderRes.status).toBe(201);
    const oldOrderId = oldOrderRes.body.order.id as number;

    const patchRes = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .set("Cookie", operatorCookie)
      .send({ name: "Brand New Name", priceSatang: 9000 });
    expect(patchRes.status).toBe(200);

    const getOldOrder = await request(app)
      .get(`/api/orders/${oldOrderId}`)
      .set("Cookie", customerCookie);
    expect(getOldOrder.status).toBe(200);
    expect(getOldOrder.body.order.totalSatang).toBe(originalPrice * 2);
    expect(getOldOrder.body.order.items[0]).toMatchObject({
      itemName: originalName,
      unitPriceSatang: originalPrice,
      lineTotalSatang: originalPrice * 2,
    });

    const dbOrderItem = await testPrisma.orderItem.findFirstOrThrow({
      where: { orderId: oldOrderId },
    });
    expect(dbOrderItem).toMatchObject({
      itemName: originalName,
      unitPriceSatang: originalPrice,
      lineTotalSatang: originalPrice * 2,
    });

    const newOrderRes = await request(app)
      .post("/api/orders")
      .set("Cookie", customerCookie)
      .send({ items: [{ menuItemId: item1.id, quantity: 1 }] });
    expect(newOrderRes.status).toBe(201);
    expect(newOrderRes.body.order.totalSatang).toBe(9000);
    expect(newOrderRes.body.order.items[0]).toMatchObject({
      itemName: "Brand New Name",
      unitPriceSatang: 9000,
    });
  });

  it("TEST-51: API priceSatang boundaries 1 and 1,000,000 accepted; invalid values return 400 without DB change", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const item1 = await testPrisma.menuItem.findFirstOrThrow({ orderBy: { id: "asc" } });
    const initialCount = await testPrisma.menuItem.count();

    for (const [idx, valid] of [1, 1_000_000].entries()) {
      const createRes = await request(app)
        .post("/api/menu-items")
        .set("Cookie", operatorCookie)
        .send({
          name: `Price Boundary ${idx}`,
          description: "Desc",
          priceSatang: valid,
          stockQty: 5,
        });
      expect(createRes.status).toBe(201);

      const patchRes = await request(app)
        .patch(`/api/menu-items/${item1.id}`)
        .set("Cookie", operatorCookie)
        .send({ priceSatang: valid });
      expect(patchRes.status).toBe(200);
    }

    const beforeInvalid = await testPrisma.menuItem.findUniqueOrThrow({ where: { id: item1.id } });
    const countAfterValid = await testPrisma.menuItem.count();
    expect(countAfterValid).toBe(initialCount + 2);

    for (const invalid of [0, -1, 1_000_001, 1.5, "6000"]) {
      const createRes = await request(app)
        .post("/api/menu-items")
        .set("Cookie", operatorCookie)
        .send({
          name: `Bad Price ${String(invalid)}`,
          description: "Desc",
          priceSatang: invalid,
          stockQty: 5,
        });
      expect(createRes.status).toBe(400);
      expect(createRes.body.error.code).toBe("VALIDATION_ERROR");

      const patchRes = await request(app)
        .patch(`/api/menu-items/${item1.id}`)
        .set("Cookie", operatorCookie)
        .send({ priceSatang: invalid });
      expect(patchRes.status).toBe(400);
      expect(patchRes.body.error.code).toBe("VALIDATION_ERROR");
    }

    expect(await testPrisma.menuItem.count()).toBe(countAfterValid);
    const afterInvalid = await testPrisma.menuItem.findUniqueOrThrow({ where: { id: item1.id } });
    expect(afterInvalid.priceSatang).toBe(beforeInvalid.priceSatang);
  });

  it("TEST-52: API stockQty boundaries 0 and 10,000 accepted; invalid values return 400 without DB change", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const item1 = await testPrisma.menuItem.findFirstOrThrow({ orderBy: { id: "asc" } });

    for (const [idx, valid] of [0, 10_000].entries()) {
      const createRes = await request(app)
        .post("/api/menu-items")
        .set("Cookie", operatorCookie)
        .send({
          name: `Stock Boundary ${idx}`,
          description: "Desc",
          priceSatang: 1000,
          stockQty: valid,
        });
      expect(createRes.status).toBe(201);

      const patchRes = await request(app)
        .patch(`/api/menu-items/${item1.id}`)
        .set("Cookie", operatorCookie)
        .send({ stockQty: valid });
      expect(patchRes.status).toBe(200);
    }

    const countBeforeInvalid = await testPrisma.menuItem.count();
    const beforeInvalid = await testPrisma.menuItem.findUniqueOrThrow({ where: { id: item1.id } });

    for (const invalid of [-1, 10_001, 1.5, "5"]) {
      const createRes = await request(app)
        .post("/api/menu-items")
        .set("Cookie", operatorCookie)
        .send({
          name: `Bad Stock ${String(invalid)}`,
          description: "Desc",
          priceSatang: 1000,
          stockQty: invalid,
        });
      expect(createRes.status).toBe(400);
      expect(createRes.body.error.code).toBe("VALIDATION_ERROR");

      const patchRes = await request(app)
        .patch(`/api/menu-items/${item1.id}`)
        .set("Cookie", operatorCookie)
        .send({ stockQty: invalid });
      expect(patchRes.status).toBe(400);
      expect(patchRes.body.error.code).toBe("VALIDATION_ERROR");
    }

    expect(await testPrisma.menuItem.count()).toBe(countBeforeInvalid);
    const afterInvalid = await testPrisma.menuItem.findUniqueOrThrow({ where: { id: item1.id } });
    expect(afterInvalid.stockQty).toBe(beforeInvalid.stockQty);
  });

  it("TEST-53: rejects missing/blank/over-length/unknown/empty/duplicate fields with 400 and allows saving own name", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const items = await testPrisma.menuItem.findMany({ orderBy: { id: "asc" }, take: 2 });
    const [item1, item2] = items;
    const initialCount = await testPrisma.menuItem.count();

    const invalidCreatePayloads = [
      { description: "Missing name", priceSatang: 1000, stockQty: 5 },
      { name: "   ", description: "Blank name", priceSatang: 1000, stockQty: 5 },
      { name: "a".repeat(101), description: "Long name", priceSatang: 1000, stockQty: 5 },
      { name: "Valid", description: "b".repeat(501), priceSatang: 1000, stockQty: 5 },
      { name: "Valid2", description: "Desc", priceSatang: 1000, stockQty: 5, isAvailable: "yes" },
      { name: "Valid3", description: "Desc", priceSatang: 1000, stockQty: 5, id: 999 },
    ];

    for (const payload of invalidCreatePayloads) {
      const res = await request(app)
        .post("/api/menu-items")
        .set("Cookie", operatorCookie)
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }

    const dupCreate = await request(app)
      .post("/api/menu-items")
      .set("Cookie", operatorCookie)
      .send({ name: item1.name, description: "Desc", priceSatang: 1000, stockQty: 5 });
    expect(dupCreate.status).toBe(400);
    expect(dupCreate.body.error.code).toBe("VALIDATION_ERROR");
    expect(dupCreate.body.error.details[0].field).toBe("name");

    const invalidUpdatePayloads = [
      {},
      { name: "   " },
      { name: "a".repeat(101) },
      { description: "b".repeat(501) },
      { isAvailable: "yes" },
      { id: 999 },
    ];

    for (const payload of invalidUpdatePayloads) {
      const res = await request(app)
        .patch(`/api/menu-items/${item2.id}`)
        .set("Cookie", operatorCookie)
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }

    const dupUpdate = await request(app)
      .patch(`/api/menu-items/${item2.id}`)
      .set("Cookie", operatorCookie)
      .send({ name: item1.name });
    expect(dupUpdate.status).toBe(400);
    expect(dupUpdate.body.error.code).toBe("VALIDATION_ERROR");
    expect(dupUpdate.body.error.details[0].field).toBe("name");

    expect(await testPrisma.menuItem.count()).toBe(initialCount);
    const afterItem2 = await testPrisma.menuItem.findUniqueOrThrow({ where: { id: item2.id } });
    expect(afterItem2).toEqual(item2);

    const ownNameUpdate = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .set("Cookie", operatorCookie)
      .send({ name: item1.name });
    expect(ownNameUpdate.status).toBe(200);
  });

  it("TEST-54: PATCH /api/menu-items/:id returns 404 for missing id and 400 for non-numeric id", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);

    const missing = await request(app)
      .patch("/api/menu-items/99999")
      .set("Cookie", operatorCookie)
      .send({ priceSatang: 5000 });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    const badId = await request(app)
      .patch("/api/menu-items/abc")
      .set("Cookie", operatorCookie)
      .send({ priceSatang: 5000 });
    expect(badId.status).toBe(400);
    expect(badId.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("TEST-55: Customer gets 403 and anonymous gets 401 on POST and PATCH without changing catalog", async () => {
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const item1 = await testPrisma.menuItem.findFirstOrThrow({ orderBy: { id: "asc" } });
    const beforeItems = await testPrisma.menuItem.findMany({ orderBy: { id: "asc" } });

    const createBody = {
      name: "Unauthorized Item",
      description: "Desc",
      priceSatang: 2000,
      stockQty: 5,
    };

    const custCreate = await request(app)
      .post("/api/menu-items")
      .set("Cookie", customerCookie)
      .send(createBody);
    expect(custCreate.status).toBe(403);
    expect(custCreate.body.error.code).toBe("FORBIDDEN");

    const anonCreate = await request(app).post("/api/menu-items").send(createBody);
    expect(anonCreate.status).toBe(401);
    expect(anonCreate.body.error.code).toBe("UNAUTHENTICATED");

    const custPatch = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .set("Cookie", customerCookie)
      .send({ priceSatang: 9999 });
    expect(custPatch.status).toBe(403);
    expect(custPatch.body.error.code).toBe("FORBIDDEN");

    const anonPatch = await request(app)
      .patch(`/api/menu-items/${item1.id}`)
      .send({ priceSatang: 9999 });
    expect(anonPatch.status).toBe(401);
    expect(anonPatch.body.error.code).toBe("UNAUTHENTICATED");

    const afterItems = await testPrisma.menuItem.findMany({ orderBy: { id: "asc" } });
    expect(afterItems).toEqual(beforeItems);
  });
});
