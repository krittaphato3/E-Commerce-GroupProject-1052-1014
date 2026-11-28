import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import type { OrderStatus } from "@prisma/client";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const CUSTOMER2_EMAIL = "customer2@campusbites.test";
const OPERATOR1_EMAIL = "operator1@campusbites.test";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "";
const OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD ?? "";
const ITERATIONS = 10;
const TOTAL = 15000;

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

function pay(orderId: number | string, cookie?: string, body?: string | object) {
  const call = request(app).post(`/api/orders/${orderId}/pay`);
  if (cookie) call.set("Cookie", cookie);
  return body === undefined ? call : call.send(body);
}

/** Every item's stock and availability, keyed by id, read straight from the database. */
async function stockSnapshot() {
  const items = await testPrisma.menuItem.findMany({
    orderBy: { id: "asc" },
    select: { id: true, stockQty: true, isAvailable: true },
  });
  return new Map(items.map(({ id, ...rest }) => [id, rest]));
}

function readOrder(orderId: number) {
  return testPrisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { history: { orderBy: { id: "asc" } } },
  });
}

/** The TEST-40 synchronization barrier: releases once `expectedCount` callers arrive. */
function createBarrier(expectedCount = 2, timeoutMs = 4000) {
  let count = 0;
  let release!: () => void;
  let rejectTimeout!: (err: Error) => void;

  const promise = new Promise<void>((resolve, reject) => {
    release = resolve;
    rejectTimeout = reject;
  });

  const timer = setTimeout(() => {
    rejectTimeout(
      new Error(`Barrier timed out after ${timeoutMs}ms waiting for ${expectedCount} callers (reached ${count})`)
    );
  }, timeoutMs);
  // A test that fails before both callers arrive must not leave an unhandled rejection.
  promise.catch(() => {});

  return async function wait() {
    count += 1;
    if (count >= expectedCount) {
      clearTimeout(timer);
      release();
    }
    await promise;
  };
}

describe("F-07 Simulated Payment (AC-68 to AC-74)", () => {
  let customer1Cookie: string;
  let operatorCookie: string;

  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
    customer1Cookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  /** A PENDING order of customer1 whose total is exactly 15000 satang (STS). */
  async function createOrder(): Promise<number> {
    const basil = await testPrisma.menuItem.update({
      where: { name: "Basil Pork Rice" },
      // Fixed here so the STS total does not depend on the seed price; stock covers every repeat.
      data: { priceSatang: 7500, stockQty: 100 },
    });
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", customer1Cookie)
      .send({ items: [{ menuItemId: basil.id, quantity: 2 }] });

    expect(response.status).toBe(201);
    expect(response.body.order.totalSatang).toBe(TOTAL);
    return response.body.order.id as number;
  }

  async function createAcceptedOrder(): Promise<number> {
    const orderId = await createOrder();
    const accepted = await request(app)
      .post(`/api/orders/${orderId}/accept`)
      .set("Cookie", operatorCookie);
    expect(accepted.status).toBe(200);
    return orderId;
  }

  /** Test helper for states the product cannot reach yet. */
  function setOrderState(orderId: number, status: OrderStatus) {
    return testPrisma.order.update({ where: { id: orderId }, data: { status } });
  }

  it("TEST-68: the owner pays the exact total of an ACCEPTED order: 200, PAID and still ACCEPTED", async () => {
    const orderId = await createAcceptedOrder();
    const orderBefore = await readOrder(orderId);
    const stockBefore = await stockSnapshot();
    const historyCountBefore = await testPrisma.orderStatusHistory.count();

    const res = await pay(orderId, customer1Cookie, { amountSatang: TOTAL });

    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({
      id: orderId,
      status: "ACCEPTED",
      paymentStatus: "PAID",
      totalSatang: TOTAL,
    });
    expect(res.body.order).not.toHaveProperty("customer");
    expect(res.body.order).not.toHaveProperty("amountSatang");

    const dbOrder = await readOrder(orderId);
    expect(dbOrder.paymentStatus).toBe("PAID");
    expect(dbOrder.status).toBe("ACCEPTED");
    expect(dbOrder.totalSatang).toBe(TOTAL);
    expect(dbOrder.history).toEqual(orderBefore.history);
    expect(await testPrisma.orderStatusHistory.count()).toBe(historyCountBefore);
    expect(await stockSnapshot()).toEqual(stockBefore);

    const view = await request(app).get(`/api/orders/${orderId}`).set("Cookie", customer1Cookie);
    expect(view.status).toBe(200);
    expect(view.body.order).toEqual(res.body.order);
  });

  it("TEST-69: total - 1 and total + 1 are 400 and leave the order UNPAID; the exact total is accepted", async () => {
    const orderId = await createAcceptedOrder();
    const orderBefore = await readOrder(orderId);

    for (const amountSatang of [TOTAL - 1, TOTAL + 1]) {
      const res = await pay(orderId, customer1Cookie, { amountSatang });

      expect(res.status, String(amountSatang)).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toBe("Payment amount must equal the order total.");
      expect(res.body.error.details).toEqual([
        { field: "amountSatang", message: `Must equal ${TOTAL}` },
      ]);
      expect(await readOrder(orderId)).toEqual(orderBefore);
    }

    const exact = await pay(orderId, customer1Cookie, { amountSatang: TOTAL });
    expect(exact.status).toBe(200);
    expect((await readOrder(orderId)).paymentStatus).toBe("PAID");
  });

  it("TEST-70: a missing or invalid body is 400 and the order stays UNPAID", async () => {
    const orderId = await createAcceptedOrder();
    const orderBefore = await readOrder(orderId);
    const bodies: Array<[label: string, body: object | undefined]> = [
      ["no body", undefined],
      ["{}", {}],
      ["0", { amountSatang: 0 }],
      ["-15000", { amountSatang: -TOTAL }],
      ["150.5", { amountSatang: 150.5 }],
      ['"15000"', { amountSatang: String(TOTAL) }],
      ["extra paymentStatus", { amountSatang: TOTAL, paymentStatus: "PAID" }],
    ];

    for (const [label, body] of bodies) {
      const res = await pay(orderId, customer1Cookie, body);

      expect(res.status, label).toBe(400);
      expect(res.body.error.code, label).toBe("VALIDATION_ERROR");
      expect(await readOrder(orderId), label).toEqual(orderBefore);
    }
  });

  it("TEST-71: paying an unpaid order that is not ACCEPTED is 409 and payment status is unchanged", async () => {
    const statuses: OrderStatus[] = [
      "PENDING",
      "PREPARING",
      "READY",
      "COMPLETED",
      "REJECTED",
      "CANCELLED",
    ];

    for (const status of statuses) {
      const orderId = await createOrder();
      await setOrderState(orderId, status);
      const orderBefore = await readOrder(orderId);

      const res = await pay(orderId, customer1Cookie, { amountSatang: TOTAL });

      expect(res.status, status).toBe(409);
      expect(res.body.error.code, status).toBe("INVALID_TRANSITION");
      expect(res.body.error.details, status).toEqual({
        from: "UNPAID",
        to: "PAID",
        orderStatus: status,
      });
      expect(await readOrder(orderId), status).toEqual(orderBefore);

      // DEC-36: the state is checked before the amount.
      const wrongAmount = await pay(orderId, customer1Cookie, { amountSatang: TOTAL - 1 });
      expect(wrongAmount.status, `${status} wrong amount`).toBe(409);
    }
  });

  it("TEST-72: paying a PAID order again is 409, in a later status too, and nothing changes", async () => {
    const orderId = await createAcceptedOrder();
    expect((await pay(orderId, customer1Cookie, { amountSatang: TOTAL })).status).toBe(200);

    for (const orderStatus of ["ACCEPTED", "PREPARING"] as const) {
      await setOrderState(orderId, orderStatus);
      const orderBefore = await readOrder(orderId);
      const stockBefore = await stockSnapshot();

      const res = await pay(orderId, customer1Cookie, { amountSatang: TOTAL });

      expect(res.status, orderStatus).toBe(409);
      expect(res.body.error.code, orderStatus).toBe("INVALID_TRANSITION");
      expect(res.body.error.details, orderStatus).toEqual({
        from: "PAID",
        to: "PAID",
        orderStatus,
      });
      expect(await readOrder(orderId), orderStatus).toEqual(orderBefore);
      expect(await stockSnapshot(), orderStatus).toEqual(stockBefore);
    }
  });

  it("TEST-73: two payments behind a barrier give exactly one 200 and one 409, 10 times", async () => {
    // Tolerates a missing module so that, before the feature exists, this test fails on
    // behaviour (the two statuses). The spy call count below makes the barrier mandatory.
    const paymentRules = await import("../src/services/paymentRules.js").catch(() => null);
    const originalAssertPaymentAllowed = paymentRules?.assertPaymentAllowed;

    for (let attempt = 1; attempt <= ITERATIONS; attempt += 1) {
      const orderId = await createAcceptedOrder();
      const barrier = createBarrier();

      // Both requests have read ACCEPTED + UNPAID before either one is allowed to write.
      const spy =
        paymentRules &&
        vi
          .spyOn(paymentRules, "assertPaymentAllowed")
          .mockImplementation(async (order, amountSatang) => {
            originalAssertPaymentAllowed!(order, amountSatang);
            await barrier();
          });

      try {
        const responses = await Promise.all([
          pay(orderId, customer1Cookie, { amountSatang: TOTAL }),
          pay(orderId, customer1Cookie, { amountSatang: TOTAL }),
        ]);

        expect(responses.map((res) => res.status).sort(), `attempt ${attempt}`).toEqual([200, 409]);
        expect(spy, `attempt ${attempt}`).toHaveBeenCalledTimes(2);

        const rejected = responses.find((res) => res.status === 409)!;
        expect(rejected.body.error.code).toBe("INVALID_TRANSITION");
        expect(rejected.body.error.details).toEqual({
          from: "PAID",
          to: "PAID",
          orderStatus: "ACCEPTED",
        });

        const dbOrder = await readOrder(orderId);
        expect(dbOrder.paymentStatus).toBe("PAID");
        expect(dbOrder.status).toBe("ACCEPTED");
        expect(dbOrder.history).toHaveLength(2);
      } finally {
        spy?.mockRestore();
      }
    }
  });

  it("TEST-74: non-owner 403, operator 403, anonymous 401, missing 404, non-numeric id 400; order stays UNPAID", async () => {
    const customer2Cookie = await loginCookie(CUSTOMER2_EMAIL, CUSTOMER_PASSWORD);
    const orderId = await createAcceptedOrder();
    const orderBefore = await readOrder(orderId);
    const body = { amountSatang: TOTAL };

    const cases = [
      { label: "customer2", res: await pay(orderId, customer2Cookie, body), status: 403, code: "FORBIDDEN" },
      { label: "operator1", res: await pay(orderId, operatorCookie, body), status: 403, code: "FORBIDDEN" },
      { label: "anonymous", res: await pay(orderId, undefined, body), status: 401, code: "UNAUTHENTICATED" },
      { label: "missing id", res: await pay(99999, customer1Cookie, body), status: 404, code: "NOT_FOUND" },
      { label: "non-numeric id", res: await pay("abc", customer1Cookie, body), status: 400, code: "VALIDATION_ERROR" },
    ];

    for (const { label, res, status, code } of cases) {
      expect(res.status, label).toBe(status);
      expect(res.body.error.code, label).toBe(code);
      expect(Object.keys(res.body), label).toEqual(["error"]);
    }

    // Generic error only: no order data in either 403 body.
    for (const { label, res } of cases.slice(0, 2)) {
      expect(Object.keys(res.body.error).sort(), label).toEqual(["code", "message"]);
      expect(JSON.stringify(res.body), label).not.toMatch(/CB-\d{6}|ACCEPTED|UNPAID|totalSatang|15000|items/);
    }

    // Ownership is decided before state and amount: a non-owner learns neither.
    const wrongAmount = await pay(orderId, customer2Cookie, { amountSatang: 1 });
    expect(wrongAmount.status).toBe(403);
    expect(Object.keys(wrongAmount.body.error).sort()).toEqual(["code", "message"]);

    expect(await readOrder(orderId)).toEqual(orderBefore);
  });
});
