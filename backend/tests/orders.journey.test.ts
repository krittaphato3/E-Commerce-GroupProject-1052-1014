import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const OPERATOR1_EMAIL = "operator1@campusbites.test";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "";
const OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD ?? "";
const QUANTITY = 2;

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

describe("Cross-feature order journey (F-03, F-04, F-07, F-08)", () => {
  beforeAll(async () => {
    // The only direct database writes: the STS precondition of a seeded database.
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-85: create, accept, pay, start, ready and complete through the API only", async () => {
    const customerCookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const item = await testPrisma.menuItem.findUniqueOrThrow({
      where: { name: "Basil Pork Rice" },
    });
    const otherStockBefore = await testPrisma.menuItem.findMany({
      where: { id: { not: item.id } },
      orderBy: { id: "asc" },
      select: { id: true, stockQty: true },
    });

    async function expectOwnerSees(
      orderId: number,
      status: string,
      paymentStatus: string,
      historyLength: number
    ) {
      const view = await request(app).get(`/api/orders/${orderId}`).set("Cookie", customerCookie);
      expect(view.status, status).toBe(200);
      expect(view.body.order, status).toMatchObject({ id: orderId, status, paymentStatus });
      expect(view.body.order.history, status).toHaveLength(historyLength);
      expect(view.body.order.history.at(-1).toStatus, status).toBe(status);
    }

    // 1. Create (F-03).
    const created = await request(app)
      .post("/api/orders")
      .set("Cookie", customerCookie)
      .send({ items: [{ menuItemId: item.id, quantity: QUANTITY }] });
    expect(created.status).toBe(201);
    const orderId = created.body.order.id as number;
    const totalSatang = created.body.order.totalSatang as number;
    await expectOwnerSees(orderId, "PENDING", "UNPAID", 1);

    // 2. Accept (F-04).
    const accepted = await request(app)
      .post(`/api/orders/${orderId}/accept`)
      .set("Cookie", operatorCookie);
    expect(accepted.status).toBe(200);
    await expectOwnerSees(orderId, "ACCEPTED", "UNPAID", 2);

    // 3. Pay (F-07): no history row.
    const paid = await request(app)
      .post(`/api/orders/${orderId}/pay`)
      .set("Cookie", customerCookie)
      .send({ amountSatang: totalSatang });
    expect(paid.status).toBe(200);
    await expectOwnerSees(orderId, "ACCEPTED", "PAID", 2);

    // 4 to 6. Start, ready, complete (F-08).
    const steps = [
      { action: "start", status: "PREPARING", historyLength: 3 },
      { action: "ready", status: "READY", historyLength: 4 },
      { action: "complete", status: "COMPLETED", historyLength: 5 },
    ];
    for (const { action, status, historyLength } of steps) {
      const res = await request(app)
        .post(`/api/orders/${orderId}/${action}`)
        .set("Cookie", operatorCookie);
      expect(res.status, action).toBe(200);
      await expectOwnerSees(orderId, status, "PAID", historyLength);
    }

    // Final state, read straight from the database.
    const customer = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER1_EMAIL } });
    const operator = await testPrisma.user.findUniqueOrThrow({ where: { email: OPERATOR1_EMAIL } });
    const dbOrder = await testPrisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { history: { orderBy: { id: "asc" } } },
    });
    expect(dbOrder.status).toBe("COMPLETED");
    expect(dbOrder.paymentStatus).toBe("PAID");
    expect(dbOrder.totalSatang).toBe(totalSatang);

    expect(
      dbOrder.history.map((row) => ({
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        actorId: row.actorId,
        actorRole: row.actorRole,
      }))
    ).toEqual([
      { fromStatus: null, toStatus: "PENDING", actorId: customer.id, actorRole: "CUSTOMER" },
      { fromStatus: "PENDING", toStatus: "ACCEPTED", actorId: operator.id, actorRole: "OPERATOR" },
      { fromStatus: "ACCEPTED", toStatus: "PREPARING", actorId: operator.id, actorRole: "OPERATOR" },
      { fromStatus: "PREPARING", toStatus: "READY", actorId: operator.id, actorRole: "OPERATOR" },
      { fromStatus: "READY", toStatus: "COMPLETED", actorId: operator.id, actorRole: "OPERATOR" },
    ]);
    const times = dbOrder.history.map((row) => row.createdAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));

    // Stock was reduced once, at order creation, and by nothing afterwards.
    const itemAfter = await testPrisma.menuItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(itemAfter.stockQty).toBe(item.stockQty - QUANTITY);
    expect(
      await testPrisma.menuItem.findMany({
        where: { id: { not: item.id } },
        orderBy: { id: "asc" },
        select: { id: true, stockQty: true },
      })
    ).toEqual(otherStockBefore);
  });
});
