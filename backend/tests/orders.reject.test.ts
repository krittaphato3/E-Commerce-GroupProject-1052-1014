import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";
import * as orderStateMachine from "../src/services/orderStateMachine.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const CUSTOMER2_EMAIL = "customer2@campusbites.test";
const OPERATOR1_EMAIL = "operator1@campusbites.test";
const OPERATOR2_EMAIL = "operator2@campusbites.test";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "";
const OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD ?? "";
const ITERATIONS = 10;
const REASON = "Sold out of basil today";

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

function reject(orderId: number | string, cookie?: string, body: object = { reason: REASON }) {
  const call = request(app).post(`/api/orders/${orderId}/reject`);
  return (cookie ? call.set("Cookie", cookie) : call).send(body);
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

function userByEmail(email: string) {
  return testPrisma.user.findUniqueOrThrow({ where: { email } });
}

/** The TEST-40 synchronization barrier: releases once `expectedCount` callers arrive. */
function createBarrier(expectedCount = 2, timeoutMs = 4000) {
  let count = 0;
  let release!: () => void;
  let rejectTimeout!: (err: Error) => void;

  const promise = new Promise<void>((resolve, rejectPromise) => {
    release = resolve;
    rejectTimeout = rejectPromise;
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

/** Makes both requests read PENDING before either one is allowed to write. */
function holdAtTransitionCheck() {
  const original = orderStateMachine.assertTransition;
  const barrier = createBarrier();
  return vi.spyOn(orderStateMachine, "assertTransition").mockImplementation(async (from, to) => {
    original(from, to);
    await barrier();
  });
}

describe("F-09 Order Rejection with Reason (AC-93, AC-94, AC-97 to AC-101)", () => {
  let customer1Cookie: string;
  let operator1Cookie: string;

  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
    customer1Cookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    operator1Cookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-93: an operator rejects a PENDING order and the trimmed reason is read back from the database and the API", async () => {
    const operator = await userByEmail(OPERATOR1_EMAIL);
    const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 2]]);

    const res = await reject(order.id, operator1Cookie, { reason: `   ${REASON}  ` });

    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({ id: order.id, status: "REJECTED", paymentStatus: "UNPAID" });
    expect(res.body.order.customer).toMatchObject({ displayName: "Alice Customer" });

    const dbOrder = await readOrder(order.id);
    expect(dbOrder.status).toBe("REJECTED");
    expect(dbOrder.paymentStatus).toBe("UNPAID");
    expect(dbOrder.history).toHaveLength(2);

    const [createRow, rejectRow] = dbOrder.history;
    expect(createRow.note).toBeNull();
    expect(rejectRow).toMatchObject({
      fromStatus: "PENDING",
      toStatus: "REJECTED",
      actorId: operator.id,
      actorRole: "OPERATOR",
      note: REASON,
    });
    expect(rejectRow.createdAt).toBeInstanceOf(Date);
    expect(rejectRow.createdAt.getTime()).toBeGreaterThanOrEqual(createRow.createdAt.getTime());

    for (const [label, cookie] of [
      ["owner", customer1Cookie],
      ["operator", operator1Cookie],
    ] as const) {
      const view = await request(app).get(`/api/orders/${order.id}`).set("Cookie", cookie);
      expect(view.status, label).toBe(200);
      expect(view.body.order.history, label).toHaveLength(2);
      expect(view.body.order.history[0].note, label).toBeNull();
      expect(view.body.order.history[1], label).toMatchObject({ toStatus: "REJECTED", note: REASON });
    }
  });

  it("TEST-94: rejecting restores each ordered item's stock exactly, including a disabled item that stays disabled", async () => {
    const basil = await itemByName("Basil Pork Rice");
    const tea = await itemByName("Thai Iced Tea");
    expect([basil.id, tea.id]).toEqual([1, 4]);

    const order = await createOrder(customer1Cookie, [
      ["Basil Pork Rice", 2],
      ["Thai Iced Tea", 3],
    ]);
    const before = await stockSnapshot();
    await testPrisma.menuItem.update({ where: { id: tea.id }, data: { isAvailable: false } });

    const res = await reject(order.id, operator1Cookie);
    expect(res.status).toBe(200);

    const expected = new Map(before);
    expected.set(basil.id, { stockQty: before.get(basil.id)!.stockQty + 2, isAvailable: true });
    expected.set(tea.id, { stockQty: before.get(tea.id)!.stockQty + 3, isAvailable: false });
    expect(await stockSnapshot()).toEqual(expected);
  });

  it("TEST-97: rejecting an order that is not PENDING returns 409 and changes nothing", async () => {
    const cases: Array<[OrderStatus, PaymentStatus]> = [
      ["ACCEPTED", "UNPAID"],
      ["PREPARING", "PAID"],
      ["READY", "PAID"],
      ["COMPLETED", "PAID"],
      ["CANCELLED", "UNPAID"],
      ["REJECTED", "UNPAID"],
    ];

    for (const [status, paymentStatus] of cases) {
      const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 1]]);

      if (status === "REJECTED") {
        // Reached through a real first reject, so the second one proves no double restore.
        expect((await reject(order.id, operator1Cookie)).status).toBe(200);
      } else {
        await testPrisma.order.update({ where: { id: order.id }, data: { status, paymentStatus } });
      }

      const stockBefore = await stockSnapshot();
      const orderBefore = await readOrder(order.id);

      const res = await reject(order.id, operator1Cookie, { reason: "A second reason" });

      expect(res.status, status).toBe(409);
      expect(res.body.error.code, status).toBe("INVALID_TRANSITION");
      expect(res.body.error.details, status).toEqual({ from: status, to: "REJECTED" });
      expect(await readOrder(order.id), status).toEqual(orderBefore);
      expect(await stockSnapshot(), status).toEqual(stockBefore);
    }
  });

  it("TEST-98: reject against customer cancel behind a barrier has exactly one winner, 10 times", async () => {
    const customer = await userByEmail(CUSTOMER1_EMAIL);
    const operator = await userByEmail(OPERATOR1_EMAIL);

    for (let attempt = 1; attempt <= ITERATIONS; attempt += 1) {
      const stockBefore = await stockSnapshot();
      const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 2]]);
      const spy = holdAtTransitionCheck();

      try {
        const [rejectRes, cancelRes] = await Promise.all([
          reject(order.id, operator1Cookie),
          request(app).post(`/api/orders/${order.id}/cancel`).set("Cookie", customer1Cookie),
        ]);

        expect([rejectRes.status, cancelRes.status].sort(), `attempt ${attempt}`).toEqual([200, 409]);
        expect(spy, `attempt ${attempt}`).toHaveBeenCalledTimes(2);

        const rejectWon = rejectRes.status === 200;
        const winner = rejectWon ? "REJECTED" : "CANCELLED";
        const loser = rejectWon ? cancelRes : rejectRes;
        expect(loser.body.error.code).toBe("INVALID_TRANSITION");
        expect(loser.body.error.details).toEqual({
          from: winner,
          to: rejectWon ? "CANCELLED" : "REJECTED",
        });

        const dbOrder = await readOrder(order.id);
        expect(dbOrder.status).toBe(winner);
        expect(dbOrder.paymentStatus).toBe("UNPAID");
        expect(dbOrder.history).toHaveLength(2);
        expect(dbOrder.history[1]).toMatchObject({
          fromStatus: "PENDING",
          toStatus: winner,
          actorId: rejectWon ? operator.id : customer.id,
          actorRole: rejectWon ? "OPERATOR" : "CUSTOMER",
          note: rejectWon ? REASON : null,
        });

        // Back to the value from before the order was placed: restored exactly once.
        expect(await stockSnapshot(), `attempt ${attempt}`).toEqual(stockBefore);
      } finally {
        spy.mockRestore();
      }
    }
  });

  it("TEST-99: reject against accept behind a barrier has exactly one winner, 10 times", async () => {
    const operator2Cookie = await loginCookie(OPERATOR2_EMAIL, OPERATOR_PASSWORD);
    const operator1 = await userByEmail(OPERATOR1_EMAIL);
    const operator2 = await userByEmail(OPERATOR2_EMAIL);
    const basil = await itemByName("Basil Pork Rice");

    for (let attempt = 1; attempt <= ITERATIONS; attempt += 1) {
      const stockBefore = (await stockSnapshot()).get(basil.id)!.stockQty;
      const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 1]]);
      const spy = holdAtTransitionCheck();

      try {
        const [rejectRes, acceptRes] = await Promise.all([
          reject(order.id, operator1Cookie),
          request(app).post(`/api/orders/${order.id}/accept`).set("Cookie", operator2Cookie),
        ]);

        expect([rejectRes.status, acceptRes.status].sort(), `attempt ${attempt}`).toEqual([200, 409]);
        expect(spy, `attempt ${attempt}`).toHaveBeenCalledTimes(2);

        const rejectWon = rejectRes.status === 200;
        const winner = rejectWon ? "REJECTED" : "ACCEPTED";
        const loser = rejectWon ? acceptRes : rejectRes;
        expect(loser.body.error.code).toBe("INVALID_TRANSITION");
        expect(loser.body.error.details).toEqual({
          from: winner,
          to: rejectWon ? "ACCEPTED" : "REJECTED",
        });

        const dbOrder = await readOrder(order.id);
        expect(dbOrder.status).toBe(winner);
        expect(dbOrder.paymentStatus).toBe("UNPAID");
        expect(dbOrder.history).toHaveLength(2);
        expect(dbOrder.history[1]).toMatchObject({
          fromStatus: "PENDING",
          toStatus: winner,
          actorId: rejectWon ? operator1.id : operator2.id,
          actorRole: "OPERATOR",
          note: rejectWon ? REASON : null,
        });

        const stockAfter = (await stockSnapshot()).get(basil.id)!.stockQty;
        expect(stockAfter, `attempt ${attempt}`).toBe(rejectWon ? stockBefore : stockBefore - 1);
      } finally {
        spy.mockRestore();
      }
    }
  });

  it("TEST-100: customers 403, anonymous 401, missing 404, bad id and invalid body 400; nothing changes", async () => {
    const customer2Cookie = await loginCookie(CUSTOMER2_EMAIL, CUSTOMER_PASSWORD);
    const order = await createOrder(customer1Cookie, [["Basil Pork Rice", 1]]);
    const stockBefore = await stockSnapshot();
    const orderBefore = await readOrder(order.id);

    const cases = [
      { label: "owner customer", res: await reject(order.id, customer1Cookie), status: 403, code: "FORBIDDEN" },
      { label: "customer2", res: await reject(order.id, customer2Cookie), status: 403, code: "FORBIDDEN" },
      { label: "anonymous", res: await reject(order.id), status: 401, code: "UNAUTHENTICATED" },
      { label: "missing id", res: await reject(99999, operator1Cookie), status: 404, code: "NOT_FOUND" },
      { label: "non-numeric id", res: await reject("abc", operator1Cookie), status: 400, code: "VALIDATION_ERROR" },
      { label: "4-character reason", res: await reject(order.id, operator1Cookie, { reason: "abcd" }), status: 400, code: "VALIDATION_ERROR" },
      { label: "empty body", res: await reject(order.id, operator1Cookie, {}), status: 400, code: "VALIDATION_ERROR" },
      { label: "extra field", res: await reject(order.id, operator1Cookie, { reason: REASON, status: "REJECTED" }), status: 400, code: "VALIDATION_ERROR" },
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

    const shortReason = cases.find((entry) => entry.label === "4-character reason")!.res;
    expect(shortReason.body.error.details[0].field).toBe("reason");

    expect(await readOrder(order.id)).toEqual(orderBefore);
    expect(await stockSnapshot()).toEqual(stockBefore);
  });

  it("TEST-101: if writing the history row fails, the response is 500 and nothing changes", async () => {
    const order = await createOrder(customer1Cookie, [
      ["Basil Pork Rice", 2],
      ["Thai Iced Tea", 3],
    ]);
    const stockBefore = await stockSnapshot();
    const orderBefore = await readOrder(order.id);

    await testPrisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION test101_reject_rejection_history() RETURNS trigger AS $$
      BEGIN
        IF NEW."toStatus" = 'REJECTED' THEN
          RAISE EXCEPTION 'TEST-101 forced history failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    try {
      await testPrisma.$executeRawUnsafe(`
        CREATE TRIGGER test101_reject_rejection_history
        BEFORE INSERT ON "OrderStatusHistory"
        FOR EACH ROW EXECUTE FUNCTION test101_reject_rejection_history()
      `);

      const res = await reject(order.id, operator1Cookie);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
      });

      expect(await readOrder(order.id)).toEqual(orderBefore);
      expect(await stockSnapshot()).toEqual(stockBefore);
    } finally {
      await testPrisma.$executeRawUnsafe(
        `DROP TRIGGER IF EXISTS test101_reject_rejection_history ON "OrderStatusHistory"`
      );
      await testPrisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS test101_reject_rejection_history()`);
    }
  });
});
