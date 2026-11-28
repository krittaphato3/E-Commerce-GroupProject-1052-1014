import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import type { OrderStatus } from "@prisma/client";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";
import * as orderStateMachine from "../src/services/orderStateMachine.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const CUSTOMER2_EMAIL = "customer2@campusbites.test";
const OPERATOR1_EMAIL = "operator1@campusbites.test";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "";
const OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD ?? "";
const ITERATIONS = 10;

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

function itemByName(name: string) {
  return testPrisma.menuItem.findUniqueOrThrow({ where: { name } });
}

async function createOrder(cookie: string, lines: Array<[name: string, quantity: number]>) {
  const items = [];
  for (const [name, quantity] of lines) {
    items.push({ menuItemId: (await itemByName(name)).id, quantity });
  }

  const response = await request(app).post("/api/orders").set("Cookie", cookie).send({ items });
  expect(response.status).toBe(201);
  return response.body.order as { id: number };
}

function cancel(orderId: number | string, cookie?: string) {
  const call = request(app).post(`/api/orders/${orderId}/cancel`);
  return cookie ? call.set("Cookie", cookie) : call;
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

describe("F-06 Customer Order Cancellation (AC-58 to AC-65)", () => {
  let customer1Cookie: string;

  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
    customer1Cookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-58: the owner cancels a PENDING order: 200, CANCELLED and UNPAID in the database, one new CUSTOMER history row", async () => {
    const customer = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER1_EMAIL } });
    const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 2]]);

    // DEC-33: the endpoint takes no body, and anything sent is ignored.
    const res = await cancel(order.id, customer1Cookie).send({
      status: "COMPLETED",
      paymentStatus: "PAID",
    });

    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({
      id: order.id,
      status: "CANCELLED",
      paymentStatus: "UNPAID",
    });
    expect(res.body.order).not.toHaveProperty("customer");

    const dbOrder = await readOrder(order.id);
    expect(dbOrder.status).toBe("CANCELLED");
    expect(dbOrder.paymentStatus).toBe("UNPAID");
    expect(dbOrder.history).toHaveLength(2);

    const [createRow, cancelRow] = dbOrder.history;
    expect(createRow.toStatus).toBe("PENDING");
    expect(cancelRow).toMatchObject({
      fromStatus: "PENDING",
      toStatus: "CANCELLED",
      actorId: customer.id,
      actorRole: "CUSTOMER",
    });
    expect(cancelRow.createdAt).toBeInstanceOf(Date);
    expect(cancelRow.createdAt.getTime()).toBeGreaterThanOrEqual(createRow.createdAt.getTime());

    const view = await request(app).get(`/api/orders/${order.id}`).set("Cookie", customer1Cookie);
    expect(view.status).toBe(200);
    expect(view.body.order).toEqual(res.body.order);
  });

  it("TEST-59: cancelling restores each ordered item's stock exactly, including a disabled item that stays disabled", async () => {
    const basil = await itemByName("Basil Pork Rice");
    const tea = await itemByName("Thai Iced Tea");
    expect([basil.id, tea.id]).toEqual([1, 4]);

    const order = await createOrder(customer1Cookie, [
      ["Basil Pork Rice", 2],
      ["Thai Iced Tea", 3],
    ]);
    const before = await stockSnapshot();
    await testPrisma.menuItem.update({ where: { id: tea.id }, data: { isAvailable: false } });

    const res = await cancel(order.id, customer1Cookie);
    expect(res.status).toBe(200);

    const expected = new Map(before);
    expected.set(basil.id, { stockQty: before.get(basil.id)!.stockQty + 2, isAvailable: true });
    expected.set(tea.id, { stockQty: before.get(tea.id)!.stockQty + 3, isAvailable: false });
    expect(await stockSnapshot()).toEqual(expected);
  });

  it("TEST-61: cancelling an order that is not PENDING returns 409 and changes nothing", async () => {
    const statuses: OrderStatus[] = [
      "ACCEPTED",
      "PREPARING",
      "READY",
      "COMPLETED",
      "REJECTED",
      "CANCELLED",
    ];

    for (const status of statuses) {
      const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 1]]);

      if (status === "CANCELLED") {
        // Reached through a real first cancel, so the second one proves no double restore.
        expect((await cancel(order.id, customer1Cookie)).status).toBe(200);
      } else {
        await testPrisma.order.update({ where: { id: order.id }, data: { status } });
      }

      const stockBefore = await stockSnapshot();
      const orderBefore = await readOrder(order.id);

      const res = await cancel(order.id, customer1Cookie);

      expect(res.status, status).toBe(409);
      expect(res.body.error.code, status).toBe("INVALID_TRANSITION");
      expect(res.body.error.details, status).toEqual({ from: status, to: "CANCELLED" });

      const orderAfter = await readOrder(order.id);
      expect(orderAfter.status, status).toBe(status);
      expect(orderAfter.history, status).toHaveLength(orderBefore.history.length);
      expect(await stockSnapshot(), status).toEqual(stockBefore);
    }
  });

  it("TEST-62: two simultaneous cancels give one 200 and one 409 and restore stock once, 10 times", async () => {
    for (let attempt = 1; attempt <= ITERATIONS; attempt += 1) {
      const stockBefore = await stockSnapshot();
      const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 2]]);

      const [res1, res2] = await Promise.all([
        cancel(order.id, customer1Cookie),
        cancel(order.id, customer1Cookie),
      ]);

      expect([res1.status, res2.status].sort(), `attempt ${attempt}`).toEqual([200, 409]);
      const rejected = res1.status === 409 ? res1 : res2;
      expect(rejected.body.error.code).toBe("INVALID_TRANSITION");
      expect(rejected.body.error.details).toEqual({ from: "CANCELLED", to: "CANCELLED" });

      // Back to the value from before the order was placed: restored exactly once.
      expect(await stockSnapshot(), `attempt ${attempt}`).toEqual(stockBefore);

      const dbOrder = await readOrder(order.id);
      expect(dbOrder.status).toBe("CANCELLED");
      expect(dbOrder.history.filter((row) => row.toStatus === "CANCELLED")).toHaveLength(1);
      expect(dbOrder.history).toHaveLength(2);
    }
  });

  it("TEST-63: cancel against operator accept behind a barrier has exactly one winner, 10 times", async () => {
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const basil = await itemByName("Basil Pork Rice");
    const originalAssertTransition = orderStateMachine.assertTransition;

    for (let attempt = 1; attempt <= ITERATIONS; attempt += 1) {
      const stockBefore = (await stockSnapshot()).get(basil.id)!.stockQty;
      const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 2]]);
      const barrier = createBarrier();

      // Both requests have read PENDING before either one is allowed to write.
      const spy = vi
        .spyOn(orderStateMachine, "assertTransition")
        .mockImplementation(async (from, to) => {
          originalAssertTransition(from, to);
          await barrier();
        });

      try {
        const [cancelRes, acceptRes] = await Promise.all([
          cancel(order.id, customer1Cookie),
          request(app).post(`/api/orders/${order.id}/accept`).set("Cookie", operatorCookie),
        ]);

        expect([cancelRes.status, acceptRes.status].sort(), `attempt ${attempt}`).toEqual([200, 409]);
        expect(spy, `attempt ${attempt}`).toHaveBeenCalledTimes(2);

        const cancelWon = cancelRes.status === 200;
        const winner = cancelWon ? "CANCELLED" : "ACCEPTED";
        const rejected = cancelWon ? acceptRes : cancelRes;
        expect(rejected.body.error.code).toBe("INVALID_TRANSITION");
        expect(rejected.body.error.details).toEqual({
          from: winner,
          to: cancelWon ? "ACCEPTED" : "CANCELLED",
        });

        const dbOrder = await readOrder(order.id);
        expect(dbOrder.status).toBe(winner);
        expect(dbOrder.history).toHaveLength(2);
        expect(dbOrder.history[1]).toMatchObject({
          fromStatus: "PENDING",
          toStatus: winner,
          actorRole: cancelWon ? "CUSTOMER" : "OPERATOR",
        });

        const stockAfter = (await stockSnapshot()).get(basil.id)!.stockQty;
        expect(stockAfter, `attempt ${attempt}`).toBe(cancelWon ? stockBefore : stockBefore - 2);
      } finally {
        spy.mockRestore();
      }
    }
  });

  it("TEST-64: if writing the history row fails, the response is 500 and nothing changes", async () => {
    const order = await createOrder(customer1Cookie, [
      ["Basil Pork Rice", 2],
      ["Thai Iced Tea", 3],
    ]);
    const stockBefore = await stockSnapshot();
    const orderBefore = await readOrder(order.id);

    await testPrisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION test64_reject_cancel_history() RETURNS trigger AS $$
      BEGIN
        IF NEW."toStatus" = 'CANCELLED' THEN
          RAISE EXCEPTION 'TEST-64 forced history failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    try {
      await testPrisma.$executeRawUnsafe(`
        CREATE TRIGGER test64_reject_cancel_history
        BEFORE INSERT ON "OrderStatusHistory"
        FOR EACH ROW EXECUTE FUNCTION test64_reject_cancel_history()
      `);

      const res = await cancel(order.id, customer1Cookie);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
      });

      expect(await readOrder(order.id)).toEqual(orderBefore);
      expect(await stockSnapshot()).toEqual(stockBefore);
    } finally {
      await testPrisma.$executeRawUnsafe(
        `DROP TRIGGER IF EXISTS test64_reject_cancel_history ON "OrderStatusHistory"`
      );
      await testPrisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS test64_reject_cancel_history()`);
    }
  });

  it("TEST-65: non-owner 403, operator 403, anonymous 401, missing 404, non-numeric id 400; nothing changes", async () => {
    const customer2Cookie = await loginCookie(CUSTOMER2_EMAIL, CUSTOMER_PASSWORD);
    const operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
    const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 1]]);
    const stockBefore = await stockSnapshot();
    const orderBefore = await readOrder(order.id);

    const cases = [
      { label: "customer2", res: await cancel(order.id, customer2Cookie), status: 403, code: "FORBIDDEN" },
      { label: "operator1", res: await cancel(order.id, operatorCookie), status: 403, code: "FORBIDDEN" },
      { label: "anonymous", res: await cancel(order.id), status: 401, code: "UNAUTHENTICATED" },
      { label: "missing id", res: await cancel(99999, customer1Cookie), status: 404, code: "NOT_FOUND" },
      { label: "non-numeric id", res: await cancel("abc", customer1Cookie), status: 400, code: "VALIDATION_ERROR" },
    ];

    for (const { label, res, status, code } of cases) {
      expect(res.status, label).toBe(status);
      expect(res.body.error.code, label).toBe(code);
      expect(Object.keys(res.body), label).toEqual(["error"]);
    }

    // Generic error only: no order data in either 403 body.
    for (const { label, res } of cases.slice(0, 2)) {
      expect(Object.keys(res.body.error).sort(), label).toEqual(["code", "message"]);
      expect(JSON.stringify(res.body), label).not.toMatch(/CB-\d{6}|PENDING|totalSatang|items/);
    }

    expect(await readOrder(order.id)).toEqual(orderBefore);
    expect(await stockSnapshot()).toEqual(stockBefore);
  });
});
