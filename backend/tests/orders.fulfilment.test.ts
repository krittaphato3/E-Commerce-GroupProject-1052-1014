import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { OrderStatus } from "@prisma/client";
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
const ITEM_NAME = "Basil Pork Rice";
const UNPAID_MESSAGE = "Order must be paid before preparation can start.";

type Action = "start" | "ready" | "complete";

const STEPS: ReadonlyArray<{ action: Action; from: OrderStatus; to: OrderStatus }> = [
  { action: "start", from: "ACCEPTED", to: "PREPARING" },
  { action: "ready", from: "PREPARING", to: "READY" },
  { action: "complete", from: "READY", to: "COMPLETED" },
];

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

function transition(action: Action, orderId: number | string, cookie?: string) {
  const call = request(app).post(`/api/orders/${orderId}/${action}`);
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

function userByEmail(email: string) {
  return testPrisma.user.findUniqueOrThrow({ where: { email } });
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

describe("F-08 Fulfilment Workflow (AC-77 to AC-84)", () => {
  let customer1Cookie: string;
  let operatorCookie: string;

  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
    // Stock covers every order the repeated cases create.
    await testPrisma.menuItem.update({ where: { name: ITEM_NAME }, data: { stockQty: 100 } });
    customer1Cookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    operatorCookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  /** A PENDING order of customer1, created through the API. */
  async function createOrder(): Promise<{ id: number; totalSatang: number }> {
    const item = await testPrisma.menuItem.findUniqueOrThrow({ where: { name: ITEM_NAME } });
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", customer1Cookie)
      .send({ items: [{ menuItemId: item.id, quantity: 2 }] });

    expect(response.status).toBe(201);
    return response.body.order;
  }

  async function createAcceptedOrder() {
    const order = await createOrder();
    const accepted = await request(app)
      .post(`/api/orders/${order.id}/accept`)
      .set("Cookie", operatorCookie);
    expect(accepted.status).toBe(200);
    return order;
  }

  /** ACCEPTED and PAID, reached through the API only. */
  async function createPaidOrder(): Promise<number> {
    const order = await createAcceptedOrder();
    const paid = await request(app)
      .post(`/api/orders/${order.id}/pay`)
      .set("Cookie", customer1Cookie)
      .send({ amountSatang: order.totalSatang });
    expect(paid.status).toBe(200);
    return order.id;
  }

  /** Test helper that forces a paid order into any status. */
  async function createPaidOrderInStatus(status: OrderStatus): Promise<number> {
    const order = await createOrder();
    await testPrisma.order.update({
      where: { id: order.id },
      data: { status, paymentStatus: "PAID" },
    });
    return order.id;
  }

  async function advance(action: Action, orderId: number) {
    const res = await transition(action, orderId, operatorCookie);
    expect(res.status, action).toBe(200);
    return res;
  }

  /** One successful step: response, database status, one new history row, nothing else changed. */
  async function expectStep(orderId: number, step: (typeof STEPS)[number]) {
    const operator = await userByEmail(OPERATOR1_EMAIL);
    const customer = await userByEmail(CUSTOMER1_EMAIL);
    const orderBefore = await readOrder(orderId);
    expect(orderBefore.status).toBe(step.from);
    const stockBefore = await stockSnapshot();

    // The endpoint takes no body, and anything sent is ignored.
    const res = await transition(step.action, orderId, operatorCookie).send({
      status: "CANCELLED",
      paymentStatus: "UNPAID",
    });

    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({
      id: orderId,
      status: step.to,
      paymentStatus: "PAID",
      customer: { id: customer.id, displayName: "Alice Customer" },
    });
    expect(Object.keys(res.body.order.customer).sort()).toEqual(["displayName", "id"]);
    expect(res.body.order.history.at(-1)).toMatchObject({
      fromStatus: step.from,
      toStatus: step.to,
      actorRole: "OPERATOR",
    });

    const dbOrder = await readOrder(orderId);
    expect(dbOrder.status).toBe(step.to);
    expect(dbOrder.paymentStatus).toBe("PAID");
    expect(dbOrder.totalSatang).toBe(orderBefore.totalSatang);
    expect(dbOrder.history).toHaveLength(orderBefore.history.length + 1);
    expect(dbOrder.history.slice(0, -1)).toEqual(orderBefore.history);

    const newRow = dbOrder.history.at(-1)!;
    expect(newRow).toMatchObject({
      fromStatus: step.from,
      toStatus: step.to,
      actorId: operator.id,
      actorRole: "OPERATOR",
    });
    expect(newRow.createdAt).toBeInstanceOf(Date);
    expect(newRow.createdAt.getTime()).toBeGreaterThanOrEqual(
      orderBefore.history.at(-1)!.createdAt.getTime()
    );
    expect(await stockSnapshot()).toEqual(stockBefore);

    // The operator view of the order is what the endpoint returned.
    const view = await request(app).get(`/api/orders/${orderId}`).set("Cookie", operatorCookie);
    expect(view.status).toBe(200);
    expect(view.body.order).toEqual(res.body.order);
  }

  it("TEST-77: starting a paid ACCEPTED order gives PREPARING with one OPERATOR history row", async () => {
    const orderId = await createPaidOrder();

    await expectStep(orderId, STEPS[0]);
  });

  it("TEST-78: marking a PREPARING order ready gives READY with one new history row", async () => {
    const orderId = await createPaidOrder();
    await advance("start", orderId);

    await expectStep(orderId, STEPS[1]);
  });

  it("TEST-79: completing a READY order gives COMPLETED with one new history row", async () => {
    const orderId = await createPaidOrder();
    await advance("start", orderId);
    await advance("ready", orderId);

    await expectStep(orderId, STEPS[2]);
  });

  it("TEST-80: starting an ACCEPTED, UNPAID order is 409 and nothing changes", async () => {
    const { id: orderId } = await createAcceptedOrder();
    const orderBefore = await readOrder(orderId);
    expect(orderBefore).toMatchObject({ status: "ACCEPTED", paymentStatus: "UNPAID" });
    const stockBefore = await stockSnapshot();

    // A body claiming the order is paid is ignored.
    const res = await transition("start", orderId, operatorCookie).send({ paymentStatus: "PAID" });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: {
        code: "INVALID_TRANSITION",
        message: UNPAID_MESSAGE,
        details: { from: "ACCEPTED", to: "PREPARING", paymentStatus: "UNPAID" },
      },
    });
    expect(await readOrder(orderId)).toEqual(orderBefore);
    expect(await stockSnapshot()).toEqual(stockBefore);
  });

  it("TEST-82: every endpoint rejects a paid order in each wrong status (18 cases)", async () => {
    const statuses = Object.values(OrderStatus);
    const orderIds = new Map<OrderStatus, number>();
    for (const status of statuses) {
      orderIds.set(status, await createPaidOrderInStatus(status));
    }
    const stockBefore = await stockSnapshot();
    let cases = 0;

    for (const { action, from: required, to } of STEPS) {
      for (const status of statuses.filter((candidate) => candidate !== required)) {
        const label = `${action} on ${status}`;
        const orderId = orderIds.get(status)!;
        const orderBefore = await readOrder(orderId);

        const res = await transition(action, orderId, operatorCookie);

        expect(res.status, label).toBe(409);
        expect(res.body.error.code, label).toBe("INVALID_TRANSITION");
        expect(res.body.error.details, label).toEqual({ from: status, to });
        expect(await readOrder(orderId), label).toEqual(orderBefore);
        cases += 1;
      }
    }

    expect(cases).toBe(18);
    expect(await stockSnapshot()).toEqual(stockBefore);
  });

  it("TEST-83: two operators making the same step behind a barrier give one 200, one 409 and one history row, 10 times per endpoint", async () => {
    const cookies = [operatorCookie, await loginCookie(OPERATOR2_EMAIL, OPERATOR_PASSWORD)];
    const operatorIds = [
      (await userByEmail(OPERATOR1_EMAIL)).id,
      (await userByEmail(OPERATOR2_EMAIL)).id,
    ];
    const originalAssertTransition = orderStateMachine.assertTransition;
    const racesPerAction: Record<Action, number> = { start: 0, ready: 0, complete: 0 };

    for (let attempt = 1; attempt <= ITERATIONS; attempt += 1) {
      // A fresh order, raced at each of its three steps.
      const orderId = await createPaidOrder();

      for (const { action, from, to } of STEPS) {
        const label = `${action}, attempt ${attempt}`;
        const barrier = createBarrier();

        // Both requests have read the required status before either one is allowed to write.
        const spy = vi
          .spyOn(orderStateMachine, "assertTransition")
          .mockImplementation(async (current, target) => {
            originalAssertTransition(current, target);
            await barrier();
          });

        try {
          const responses = await Promise.all(
            cookies.map((cookie) => transition(action, orderId, cookie))
          );

          expect(responses.map((res) => res.status).sort(), label).toEqual([200, 409]);
          expect(spy, label).toHaveBeenCalledTimes(2);

          const rejected = responses.find((res) => res.status === 409)!;
          expect(rejected.body.error.code, label).toBe("INVALID_TRANSITION");
          expect(rejected.body.error.details, label).toEqual({ from: to, to });

          const dbOrder = await readOrder(orderId);
          expect(dbOrder.status, label).toBe(to);
          expect(dbOrder.paymentStatus, label).toBe("PAID");
          const stepRows = dbOrder.history.filter(
            (row) => row.fromStatus === from && row.toStatus === to
          );
          expect(stepRows, label).toHaveLength(1);
          const winner = responses.findIndex((res) => res.status === 200);
          expect(stepRows[0], label).toMatchObject({
            actorId: operatorIds[winner],
            actorRole: "OPERATOR",
          });
          racesPerAction[action] += 1;
        } finally {
          spy.mockRestore();
        }
      }

      // create, accept and exactly one row for each of the three raced steps.
      expect((await readOrder(orderId)).history).toHaveLength(5);
    }

    expect(racesPerAction).toEqual({ start: 10, ready: 10, complete: 10 });
  });

  it("TEST-84: owner and other customer 403, anonymous 401, missing 404, bad id 400; nothing changes", async () => {
    const customer2Cookie = await loginCookie(CUSTOMER2_EMAIL, CUSTOMER_PASSWORD);

    for (const { action, from } of STEPS) {
      const orderId = await createPaidOrderInStatus(from);
      const orderBefore = await readOrder(orderId);
      const stockBefore = await stockSnapshot();

      const cases = [
        { label: "owner customer1", res: await transition(action, orderId, customer1Cookie), status: 403, code: "FORBIDDEN" },
        { label: "customer2", res: await transition(action, orderId, customer2Cookie), status: 403, code: "FORBIDDEN" },
        // The role is checked before the id, so a customer learns nothing from either.
        { label: "customer, missing id", res: await transition(action, 99999, customer1Cookie), status: 403, code: "FORBIDDEN" },
        { label: "customer, bad id", res: await transition(action, "abc", customer1Cookie), status: 403, code: "FORBIDDEN" },
        { label: "anonymous", res: await transition(action, orderId), status: 401, code: "UNAUTHENTICATED" },
        { label: "missing id", res: await transition(action, 99999, operatorCookie), status: 404, code: "NOT_FOUND" },
        { label: "non-numeric id", res: await transition(action, "abc", operatorCookie), status: 400, code: "VALIDATION_ERROR" },
      ];

      for (const { label, res, status, code } of cases) {
        expect(res.status, `${action} ${label}`).toBe(status);
        expect(res.body.error.code, `${action} ${label}`).toBe(code);
        expect(Object.keys(res.body), `${action} ${label}`).toEqual(["error"]);
      }

      // Generic error only: no order data in any 403 body.
      for (const { label, res } of cases.slice(0, 4)) {
        expect(Object.keys(res.body.error).sort(), `${action} ${label}`).toEqual(["code", "message"]);
        expect(JSON.stringify(res.body), `${action} ${label}`).not.toMatch(
          /CB-\d{6}|ACCEPTED|PREPARING|READY|PAID|totalSatang|items|Alice/
        );
      }

      expect(await readOrder(orderId), action).toEqual(orderBefore);
      expect(await stockSnapshot(), action).toEqual(stockBefore);
    }
  });
});
