import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const CUSTOMER2_EMAIL = "customer2@campusbites.test";
const OPERATOR1_EMAIL = "operator1@campusbites.test";
const OPERATOR2_EMAIL = "operator2@campusbites.test";
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

describe("F-04 Operator Order Management (AC-32 to AC-40)", () => {
  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-32: GET /api/orders as an operator returns all orders oldest first with customer displayName and no email", async () => {
    const customer1Cookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const customer2Cookie = await loginCookie(CUSTOMER2_EMAIL, CUSTOMER_PASSWORD);
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);

    const o1 = await createOrder(customer1Cookie, "Basil Pork Rice", 1);
    const o2 = await createOrder(customer2Cookie, "Thai Iced Tea", 2);

    const res = await request(app).get("/api/orders").set("Cookie", operatorCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBeGreaterThanOrEqual(2);

    const ids = res.body.orders.map((o: { id: number }) => o.id);
    expect(ids.indexOf(o1.id)).toBeLessThan(ids.indexOf(o2.id));

    const foundO1 = res.body.orders.find((o: { id: number }) => o.id === o1.id);
    expect(foundO1).toBeDefined();
    expect(foundO1).toMatchObject({
      id: o1.id,
      orderNumber: o1.orderNumber,
      status: "PENDING",
      paymentStatus: "UNPAID",
      totalSatang: o1.totalSatang,
      itemCount: 1,
      customer: {
        displayName: "Alice Customer",
      },
    });
    expect(typeof foundO1.customer.id).toBe("number");
    expect(typeof foundO1.createdAt).toBe("string");

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain("customer1@campusbites.test");
    expect(bodyStr).not.toContain("passwordHash");
  });

  it("TEST-33: GET /api/orders filters by status and returns 400 VALIDATION_ERROR for an unknown status", async () => {
    const customer1Cookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);

    const o1 = await createOrder(customer1Cookie, "Basil Pork Rice", 1);

    const pendingRes = await request(app)
      .get("/api/orders?status=PENDING")
      .set("Cookie", operatorCookie);
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.orders.some((o: { id: number }) => o.id === o1.id)).toBe(true);

    const acceptedRes = await request(app)
      .get("/api/orders?status=ACCEPTED")
      .set("Cookie", operatorCookie);
    expect(acceptedRes.status).toBe(200);
    expect(acceptedRes.body.orders.some((o: { id: number }) => o.id === o1.id)).toBe(false);

    const bogusRes = await request(app)
      .get("/api/orders?status=BOGUS")
      .set("Cookie", operatorCookie);
    expect(bogusRes.status).toBe(400);
    expect(bogusRes.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("TEST-34: POST /api/orders/:id/accept transitions a PENDING order to ACCEPTED and records an OPERATOR history row with createdAt", async () => {
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const operatorUser = await testPrisma.user.findUniqueOrThrow({ where: { email: OPERATOR1_EMAIL } });

    const order = await createOrder(customerCookie, "Basil Pork Rice", 1);

    const acceptRes = await request(app)
      .post(`/api/orders/${order.id}/accept`)
      .set("Cookie", operatorCookie);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.order.status).toBe("ACCEPTED");

    const dbOrder = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { history: { orderBy: { id: "asc" } } },
    });
    expect(dbOrder.status).toBe("ACCEPTED");
    expect(dbOrder.history).toHaveLength(2);

    const [createRow, acceptRow] = dbOrder.history;
    expect(createRow.toStatus).toBe("PENDING");
    expect(acceptRow).toMatchObject({
      fromStatus: "PENDING",
      toStatus: "ACCEPTED",
      actorRole: "OPERATOR",
      actorId: operatorUser.id,
    });
    expect(acceptRow.createdAt).toBeInstanceOf(Date);
    expect(acceptRow.createdAt.getTime()).toBeGreaterThanOrEqual(createRow.createdAt.getTime());
    expect(acceptRow.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("TEST-35: POST /api/orders/:id/accept on an already ACCEPTED order returns 409 INVALID_TRANSITION and leaves status and history unchanged", async () => {
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);

    const order = await createOrder(customerCookie, "Basil Pork Rice", 1);

    const first = await request(app)
      .post(`/api/orders/${order.id}/accept`)
      .set("Cookie", operatorCookie);
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/orders/${order.id}/accept`)
      .set("Cookie", operatorCookie);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("INVALID_TRANSITION");
    expect(second.body.error.details).toEqual({ from: "ACCEPTED", to: "ACCEPTED" });

    const dbOrder = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { history: true },
    });
    expect(dbOrder.status).toBe("ACCEPTED");
    expect(dbOrder.history).toHaveLength(2);
  });

  it("TEST-36: POST /api/orders/:id/accept returns 404 NOT_FOUND for a missing order and 400 VALIDATION_ERROR for a non-numeric id", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);

    const missing = await request(app)
      .post("/api/orders/99999/accept")
      .set("Cookie", operatorCookie);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    const nonNumeric = await request(app)
      .post("/api/orders/abc/accept")
      .set("Cookie", operatorCookie);
    expect(nonNumeric.status).toBe(400);
    expect(nonNumeric.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("TEST-37: a customer gets 403 FORBIDDEN and an anonymous caller gets 401 UNAUTHENTICATED when calling POST /api/orders/:id/accept", async () => {
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const order = await createOrder(customerCookie, "Basil Pork Rice", 1);

    const customerRes = await request(app)
      .post(`/api/orders/${order.id}/accept`)
      .set("Cookie", customerCookie);
    expect(customerRes.status).toBe(403);
    expect(customerRes.body.error.code).toBe("FORBIDDEN");

    const anonymousRes = await request(app).post(`/api/orders/${order.id}/accept`);
    expect(anonymousRes.status).toBe(401);
    expect(anonymousRes.body.error.code).toBe("UNAUTHENTICATED");

    const dbOrder = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { history: true },
    });
    expect(dbOrder.status).toBe("PENDING");
    expect(dbOrder.history).toHaveLength(1);
  });

  it("TEST-38: a customer gets 403 FORBIDDEN and an anonymous caller gets 401 UNAUTHENTICATED when calling GET /api/orders, with no order data", async () => {
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    await createOrder(customerCookie, "Basil Pork Rice", 1);

    const customerRes = await request(app)
      .get("/api/orders")
      .set("Cookie", customerCookie);
    expect(customerRes.status).toBe(403);
    expect(customerRes.body.error.code).toBe("FORBIDDEN");
    expect(customerRes.body).not.toHaveProperty("orders");

    const anonymousRes = await request(app).get("/api/orders");
    expect(anonymousRes.status).toBe(401);
    expect(anonymousRes.body.error.code).toBe("UNAUTHENTICATED");
    expect(anonymousRes.body).not.toHaveProperty("orders");
  });

  it("TEST-39: an operator can GET /api/orders/:id for any customer's order and receives customer.displayName without email or passwordHash", async () => {
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);

    const order = await createOrder(customerCookie, "Basil Pork Rice", 1);

    const res = await request(app)
      .get(`/api/orders/${order.id}`)
      .set("Cookie", operatorCookie);

    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe(order.id);
    expect(res.body.order.customer).toBeDefined();
    expect(res.body.order.customer.displayName).toBe("Alice Customer");

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain("customer1@campusbites.test");
    expect(bodyStr).not.toContain("passwordHash");
  });

  it("TEST-40: two operators accepting the same PENDING order concurrently produce one 200, one 409, and one accept history row across 10 runs", async () => {
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const operator1Cookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const operator2Cookie = await loginCookie(OPERATOR2_EMAIL, OPERATOR_PASSWORD);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const order = await createOrder(customerCookie, "Basil Pork Rice", 1);

      const [res1, res2] = await Promise.all([
        request(app).post(`/api/orders/${order.id}/accept`).set("Cookie", operator1Cookie),
        request(app).post(`/api/orders/${order.id}/accept`).set("Cookie", operator2Cookie),
      ]);

      const statuses = [res1.status, res2.status].sort((a, b) => a - b);
      expect(statuses, `attempt ${attempt + 1}`).toEqual([200, 409]);

      const rejected = res1.status === 409 ? res1 : res2;
      expect(rejected.body.error.code).toBe("INVALID_TRANSITION");

      const dbOrder = await testPrisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { history: true },
      });
      expect(dbOrder.status).toBe("ACCEPTED");
      expect(dbOrder.history).toHaveLength(2);
    }
  });
});
