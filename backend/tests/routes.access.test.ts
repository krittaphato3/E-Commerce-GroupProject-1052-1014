import { describe, it, expect, beforeEach, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import type { Role } from "@prisma/client";
import { createApp } from "../src/app.js";
import {
  publicRoutes,
  protectedRoutes,
  extractExpressRoutes,
  findUnregisteredRoutes,
  type HttpMethod,
  type ExpressRoute,
} from "../src/routes/registry.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

const CUSTOMER1_EMAIL = "customer1@campusbites.test";
const CUSTOMER2_EMAIL = "customer2@campusbites.test";
const OPERATOR1_EMAIL = "operator1@campusbites.test";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "";
const OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD ?? "";

const ALL_ROLES: ReadonlyArray<Role> = ["CUSTOMER", "OPERATOR"];

// AC-43: neither the 401 nor the 403 body may carry order, item, user or email data.
const PRIVATE_FRAGMENTS = [
  "orders",
  "items",
  "user",
  "email",
  "orderNumber",
  "totalSatang",
  "passwordHash",
  "displayName",
];

function sessionCookie(response: SupertestResponse): string | undefined {
  const raw = response.headers["set-cookie"];
  const cookies = raw ? (Array.isArray(raw) ? raw : [String(raw)]) : [];
  return cookies.find((value) => value.startsWith("cb_session="))?.split(";")[0];
}

async function loginCookie(email: string, password: string): Promise<string> {
  const response = await requestApp("POST", "/api/auth/login").send({ email, password });
  expect(response.status, `login ${email}`).toBe(200);
  const cookie = sessionCookie(response);
  expect(cookie, `login ${email}`).toBeDefined();
  return cookie as string;
}

const app = createApp();

function requestApp(method: HttpMethod, path: string, cookie?: string) {
  const agent = method === "GET" ? request(app).get(path) : request(app).post(path);
  return cookie ? agent.set("Cookie", cookie) : agent;
}

/** Replaces `:id` with a concrete order id so a registry entry can be called. */
function concretePath(path: string, orderId: number): string {
  return path.replace(":id", String(orderId));
}

function formatRoute(route: ExpressRoute): string {
  return `${route.method} ${route.path}`;
}

function assertNoPrivateData(response: SupertestResponse, label: string): void {
  expect(Object.keys(response.body), label).toEqual(["error"]);
  expect(Object.keys(response.body.error).sort(), label).toEqual(["code", "message"]);

  const serialized = JSON.stringify(response.body);
  for (const fragment of PRIVATE_FRAGMENTS) {
    expect(serialized, `${label} must not contain "${fragment}"`).not.toContain(fragment);
  }
  expect(serialized, `${label} must not contain an email address`).not.toContain("@");
}

describe("R-01 route access control and registry completeness (AC-43)", () => {
  let customer1Cookie: string;
  let customer2Cookie: string;
  let operator1Cookie: string;
  let order1Id: number;

  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);

    customer1Cookie = await loginCookie(CUSTOMER1_EMAIL, CUSTOMER_PASSWORD);
    customer2Cookie = await loginCookie(CUSTOMER2_EMAIL, CUSTOMER_PASSWORD);
    operator1Cookie = await loginCookie(OPERATOR1_EMAIL, OPERATOR_PASSWORD);

    // One PENDING order owned by customer1, used by the negative phase only.
    const basil = await testPrisma.menuItem.findUniqueOrThrow({
      where: { name: "Basil Pork Rice" },
    });
    const created = await requestApp("POST", "/api/orders", customer1Cookie).send({
      items: [{ menuItemId: basil.id, quantity: 1 }],
    });
    expect(created.status).toBe(201);
    order1Id = created.body.order.id as number;
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-43: every protected route answers 401 anonymously and 403 for each non-allowed role without private data", async () => {
    expect(
      protectedRoutes.length,
      "the registry must list the six protected Sprint 1 routes"
    ).toBe(6);

    const cookies: Record<Role, string> = {
      CUSTOMER: customer1Cookie,
      OPERATOR: operator1Cookie,
    };

    // Phase 1: non-mutating negative checks first.
    let wrongRoleChecks = 0;

    for (const entry of protectedRoutes) {
      const path = concretePath(entry.path, order1Id);
      const label = `${entry.method} ${entry.path}`;

      const anonymous = await requestApp(entry.method, path);
      expect(anonymous.status, `${label} anonymous`).toBe(401);
      expect(anonymous.body.error.code, `${label} anonymous`).toBe("UNAUTHENTICATED");
      assertNoPrivateData(anonymous, `${label} anonymous`);

      // A route that allows both roles has no non-allowed role to reject.
      const wrongRoles = ALL_ROLES.filter((role) => !entry.roles.includes(role));

      for (const role of wrongRoles) {
        wrongRoleChecks += 1;
        const forbidden = await requestApp(entry.method, path, cookies[role]);
        expect(forbidden.status, `${label} as ${role}`).toBe(403);
        expect(forbidden.body.error.code, `${label} as ${role}`).toBe("FORBIDDEN");
        assertNoPrivateData(forbidden, `${label} as ${role}`);
      }
    }

    expect(wrongRoleChecks, "the 403 loop must not be vacuous").toBeGreaterThan(0);

    // Q-03 / BR-08 / NFR-02: a customer may not read another customer's order.
    const crossOwner = await requestApp(
      "GET",
      `/api/orders/${order1Id}`,
      customer2Cookie
    );
    expect(crossOwner.status, "customer2 reading customer1's order").toBe(403);
    expect(crossOwner.body.error.code).toBe("FORBIDDEN");
    assertNoPrivateData(crossOwner, "customer2 reading customer1's order");

    // Nothing in the negative phase may mutate state.
    const untouched = await testPrisma.order.findUniqueOrThrow({ where: { id: order1Id } });
    expect(untouched.status).toBe("PENDING");
    expect(await testPrisma.order.count()).toBe(1);

    // Phase 2: positive controls for the allowed roles.
    const me = await requestApp("GET", "/api/auth/me", customer1Cookie);
    expect(me.status).toBe(200);
    expect(typeof me.body.user.id).toBe("number");

    const greenCurry = await testPrisma.menuItem.findUniqueOrThrow({
      where: { name: "Green Curry with Rice" },
    });
    const createdByCustomer = await requestApp("POST", "/api/orders", customer1Cookie).send({
      items: [{ menuItemId: greenCurry.id, quantity: 1 }],
    });
    expect(createdByCustomer.status).toBe(201);

    const listAsOperator = await requestApp("GET", "/api/orders", operator1Cookie);
    expect(listAsOperator.status).toBe(200);
    expect(Array.isArray(listAsOperator.body.orders)).toBe(true);

    const mine = await requestApp("GET", "/api/orders/mine", customer1Cookie);
    expect(mine.status).toBe(200);

    const ownerView = await requestApp("GET", `/api/orders/${order1Id}`, customer1Cookie);
    expect(ownerView.status).toBe(200);

    const operatorView = await requestApp("GET", `/api/orders/${order1Id}`, operator1Cookie);
    expect(operatorView.status).toBe(200);

    // Run the only mutating allowed-role control last.
    const accepted = await requestApp(
      "POST",
      `/api/orders/${order1Id}/accept`,
      operator1Cookie
    );
    expect(accepted.status).toBe(200);
    expect(accepted.body.order.status).toBe("ACCEPTED");
  });

  it("TEST-43: the registry and the mounted Express routes are in exact agreement", () => {
    const registry = [...publicRoutes, ...protectedRoutes].map(formatRoute).sort();
    const mounted = extractExpressRoutes(app).map(formatRoute).sort();

    expect(publicRoutes.length, "four public routes").toBe(4);
    expect(protectedRoutes.length, "six protected routes").toBe(6);
    expect(mounted).toHaveLength(10);

    // Every mounted route is registered.
    expect(mounted).toEqual(registry);

    // Every registered route is mounted.
    expect(registry).toEqual(mounted);

    // The registry itself has no duplicates and no route in both lists.
    expect(new Set(registry).size).toBe(registry.length);
    const publicSet = new Set(publicRoutes.map(formatRoute));
    for (const route of protectedRoutes.map(formatRoute)) {
      expect(publicSet.has(route)).toBe(false);
    }

    // Positive proof: the real application has nothing unregistered.
    expect(findUnregisteredRoutes(app)).toEqual([]);

    // Negative proof 1: a top-level route added through the createApp hook is caught.
    const appWithProbe = createApp((server) => {
      server.get("/api/unregistered-probe", (_req, res) => {
        res.json({ ok: true });
      });
    });
    expect(findUnregisteredRoutes(appWithProbe)).toEqual(["GET /api/unregistered-probe"]);

    // Negative proof 2: a sub-router mounted without mountRouter is caught too.
    const probeRouter = express.Router();
    probeRouter.get("/probe", (_req, res) => {
      res.json({ ok: true });
    });
    const appWithRawMount = createApp((server) => {
      server.use("/api/raw-probe", probeRouter);
    });
    const rawUnregistered = findUnregisteredRoutes(appWithRawMount);
    expect(rawUnregistered.length).toBeGreaterThan(0);
    expect(rawUnregistered.some((route) => route.startsWith("GET "))).toBe(true);
  });
});
