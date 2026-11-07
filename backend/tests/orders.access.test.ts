import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const CUSTOMER2_EMAIL = "customer2@campusbites.test";
const OPERATOR_EMAIL = "operator1@campusbites.test";
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

async function createOrder(cookie: string, menuItemName: string, quantity = 1) {
  const item = await testPrisma.menuItem.findUniqueOrThrow({ where: { name: menuItemName } });
  const response = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({ items: [{ menuItemId: item.id, quantity }] });

  expect(response.status).toBe(201);
  return response.body.order as { id: number; orderNumber: string; totalSatang: number };
}

describe("F-03 Order access control (AC-26 to AC-28)", () => {
  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-26: an operator gets 403 and an anonymous caller 401 when submitting an order", async () => {
    const operatorCookie = await loginCookie(OPERATOR_EMAIL, OPERATOR_PASSWORD);
    const basil = await testPrisma.menuItem.findUniqueOrThrow({
      where: { name: "Basil Pork Rice" },
    });
    const body = { items: [{ menuItemId: basil.id, quantity: 1 }] };

    const asOperator = await request(app)
      .post("/api/orders")
      .set("Cookie", operatorCookie)
      .send(body);
    expect(asOperator.status).toBe(403);
    expect(asOperator.body.error.code).toBe("FORBIDDEN");

    const anonymous = await request(app).post("/api/orders").send(body);
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe("UNAUTHENTICATED");

    expect(await testPrisma.order.count()).toBe(0);
    expect(
      (await testPrisma.menuItem.findUniqueOrThrow({ where: { id: basil.id } })).stockQty
    ).toBe(basil.stockQty);
  });

  it("TEST-27: another customer gets 403, the owner 200, a missing id 404 and a non-numeric id 400", async () => {
    const ownerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const otherCookie = await loginCookie(CUSTOMER2_EMAIL, CUSTOMER_PASSWORD);
    const order = await createOrder(ownerCookie, "Basil Pork Rice", 1);

    const forbidden = await request(app)
      .get(`/api/orders/${order.id}`)
      .set("Cookie", otherCookie);

    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe("FORBIDDEN");
    expect(Object.keys(forbidden.body)).toEqual(["error"]);
    expect(JSON.stringify(forbidden.body)).not.toContain("orderNumber");
    expect(JSON.stringify(forbidden.body)).not.toContain("totalSatang");

    const ownerView = await request(app)
      .get(`/api/orders/${order.id}`)
      .set("Cookie", ownerCookie);
    expect(ownerView.status).toBe(200);
    expect(ownerView.body.order.id).toBe(order.id);

    const missing = await request(app)
      .get("/api/orders/99999")
      .set("Cookie", ownerCookie);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    const malformed = await request(app)
      .get("/api/orders/abc")
      .set("Cookie", ownerCookie);
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe("VALIDATION_ERROR");

    const anonymous = await request(app).get(`/api/orders/${order.id}`);
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("TEST-28: GET /api/orders/mine returns only the caller's orders, newest first", async () => {
    const customerOneCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const customerTwoCookie = await loginCookie(CUSTOMER2_EMAIL, CUSTOMER_PASSWORD);
    const operatorCookie = await loginCookie(OPERATOR_EMAIL, OPERATOR_PASSWORD);

    const first = await createOrder(customerOneCookie, "Basil Pork Rice", 1);
    const second = await createOrder(customerOneCookie, "Thai Iced Tea", 2);
    const otherCustomer = await createOrder(customerTwoCookie, "Fried Rice with Egg", 1);

    const mine = await request(app)
      .get("/api/orders/mine")
      .set("Cookie", customerOneCookie);

    expect(mine.status).toBe(200);
    expect(mine.body.orders.map((order: { id: number }) => order.id)).toEqual([
      second.id,
      first.id,
    ]);
    expect(mine.body.orders.map((order: { id: number }) => order.id)).not.toContain(
      otherCustomer.id
    );

    for (const order of mine.body.orders) {
      expect(order).toMatchObject({
        orderNumber: expect.stringMatching(/^CB-\d{6}$/),
        status: "PENDING",
        paymentStatus: "UNPAID",
        itemCount: expect.any(Number),
      });
      expect(typeof order.totalSatang).toBe("number");
      expect(typeof order.createdAt).toBe("string");
    }

    const asOperator = await request(app)
      .get("/api/orders/mine")
      .set("Cookie", operatorCookie);
    expect(asOperator.status).toBe(403);
    expect(asOperator.body.error.code).toBe("FORBIDDEN");
    expect(asOperator.body).not.toHaveProperty("orders");

    const anonymous = await request(app).get("/api/orders/mine");
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe("UNAUTHENTICATED");
    expect(anonymous.body).not.toHaveProperty("orders");
  });
});
