import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { createHash, randomBytes } from "node:crypto";
import { app, createApp } from "../src/app.js";
import { requireAuth, requireRole } from "../src/middleware/auth.js";
import { authService } from "../src/services/authService.js";
import { sessionRepository } from "../src/repositories/sessionRepository.js";
import type { PublicUser } from "../src/repositories/userRepository.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

const CUSTOMER_EMAIL = "customer1@campusbites.test";
const OPERATOR_EMAIL = "operator1@campusbites.test";
const SESSION_COOKIE = "cb_session";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD ?? "";
const OPERATOR_PASSWORD = process.env.SEED_OPERATOR_PASSWORD ?? "";

function setCookies(response: SupertestResponse): string[] {
  const raw = response.headers["set-cookie"];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [String(raw)];
}

function sessionCookie(response: SupertestResponse): string | undefined {
  const cookie = setCookies(response).find((value) => value.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.split(";")[0];
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function login(email: unknown, password: unknown) {
  return request(app).post("/api/auth/login").send({ email, password });
}

async function loginAs(email: string, password: string) {
  return login(email, password);
}

describe("F-01 Authentication API (AC-01 to AC-08)", () => {
  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-01: valid credentials return the user, set the session cookie and create one 8-hour session", async () => {
    const response = await loginAs(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: CUSTOMER_EMAIL,
      displayName: "Alice Customer",
      role: "CUSTOMER",
    });
    expect(typeof response.body.user.id).toBe("number");
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");

    const cookies = setCookies(response);
    const cookie = sessionCookie(response);
    expect(cookie).toBeDefined();
    const rawCookie = cookies.find((value) => value.startsWith(`${SESSION_COOKIE}=`)) ?? "";
    expect(rawCookie).toMatch(/HttpOnly/i);
    expect(rawCookie).toMatch(/SameSite=Lax/i);
    expect(rawCookie).toMatch(/Path=\//i);
    expect(rawCookie).toMatch(/Max-Age=28800/i);

    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER_EMAIL } });
    const sessions = await testPrisma.session.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(1);

    const minutesUntilExpiry = (sessions[0].expiresAt.getTime() - Date.now()) / 60000;
    expect(minutesUntilExpiry).toBeGreaterThan(7 * 60 + 59);
    expect(minutesUntilExpiry).toBeLessThan(8 * 60 + 1);
  });

  it("TEST-02: a wrong password returns 401 INVALID_CREDENTIALS, sets no cookie and creates no session", async () => {
    const response = await loginAs(CUSTOMER_EMAIL, `${CUSTOMER_PASSWORD}-wrong`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(response.body.error.message).toBe("Invalid email or password.");
    expect(setCookies(response)).toHaveLength(0);

    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER_EMAIL } });
    expect(await testPrisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("TEST-03: an unknown email returns the same 401 response as a wrong password", async () => {
    const wrongPassword = await loginAs(CUSTOMER_EMAIL, `${CUSTOMER_PASSWORD}-wrong`);
    const unknownEmail = await loginAs("nobody@campusbites.test", CUSTOMER_PASSWORD);

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error.code).toBe(wrongPassword.body.error.code);
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
    expect(setCookies(unknownEmail)).toHaveLength(0);
    expect(JSON.stringify(unknownEmail.body)).not.toContain("nobody@campusbites.test");
  });

  it("TEST-03 (regression): unknown-email login lazily creates and caches a dummy hash at env.BCRYPT_ROUNDS", async () => {
    const previousRounds = process.env.BCRYPT_ROUNDS;
    process.env.BCRYPT_ROUNDS = "6";
    vi.resetModules();

    let disconnectFreshPrisma: (() => Promise<void>) | undefined;
    try {
      const { prisma: freshPrisma } = await import("../src/db/prisma.js");
      disconnectFreshPrisma = () => freshPrisma.$disconnect();
      const passwordModule = await import("../src/services/password.js");
      const verifySpy = vi.spyOn(passwordModule, "verifyPassword");
      const { authService: freshAuthService } = await import("../src/services/authService.js");

      await expect(
        freshAuthService.login("nobody@campusbites.test", CUSTOMER_PASSWORD)
      ).resolves.toBeNull();
      await expect(
        freshAuthService.login("nobody@campusbites.test", CUSTOMER_PASSWORD)
      ).resolves.toBeNull();

      expect(verifySpy).toHaveBeenCalledTimes(2);
      const firstDummyHash = verifySpy.mock.calls[0]?.[1];
      const secondDummyHash = verifySpy.mock.calls[1]?.[1];
      expect(firstDummyHash).toMatch(/^\$2[aby]\$06\$/);
      expect(secondDummyHash).toBe(firstDummyHash);
    } finally {
      process.env.BCRYPT_ROUNDS = previousRounds;
      await disconnectFreshPrisma?.();
      vi.restoreAllMocks();
      vi.resetModules();
    }
  });

  it("TEST-04: invalid login bodies return 400 VALIDATION_ERROR in the standard error shape", async () => {
    const cases: Array<{ name: string; body: unknown }> = [
      { name: "empty body", body: {} },
      { name: "missing email", body: { password: CUSTOMER_PASSWORD } },
      { name: "password is a number", body: { email: CUSTOMER_EMAIL, password: 12345678 } },
      { name: "malformed email", body: { email: "abc", password: CUSTOMER_PASSWORD } },
      {
        name: "unknown field role",
        body: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD, role: "OPERATOR" },
      },
      {
        name: "over-length email",
        body: { email: `${"a".repeat(250)}@example.com`, password: CUSTOMER_PASSWORD },
      },
      {
        name: "over-length password",
        body: { email: CUSTOMER_EMAIL, password: "p".repeat(129) },
      },
    ];

    for (const testCase of cases) {
      const response = await request(app).post("/api/auth/login").send(testCase.body);

      expect(response.status, testCase.name).toBe(400);
      expect(response.body.error.code, testCase.name).toBe("VALIDATION_ERROR");
      expect(typeof response.body.error.message, testCase.name).toBe("string");
    }

    expect(await testPrisma.session.count()).toBe(0);
  });

  it("TEST-05: GET /api/auth/me returns the logged-in operator and rejects an anonymous caller", async () => {
    const loggedIn = await loginAs(OPERATOR_EMAIL, OPERATOR_PASSWORD);
    expect(loggedIn.status).toBe(200);
    const cookie = sessionCookie(loggedIn);
    expect(cookie).toBeDefined();

    const me = await request(app).get("/api/auth/me").set("Cookie", cookie as string);
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({
      email: OPERATOR_EMAIL,
      displayName: "Staff Operator 1",
      role: "OPERATOR",
    });
    expect(Object.keys(me.body.user).sort()).toEqual(["displayName", "email", "id", "role"]);
    expect(JSON.stringify(me.body)).not.toContain("passwordHash");

    const anonymous = await request(app).get("/api/auth/me");
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe("UNAUTHENTICATED");
    expect(anonymous.body).not.toHaveProperty("user");
  });

  it("TEST-05 (regression): GET /api/auth/me returns only { id, email, displayName, role } even if upstream user object has extra keys", async () => {
    const fullUserRow = await testPrisma.user.findUniqueOrThrow({
      where: { email: OPERATOR_EMAIL },
    });
    const spy = vi
      .spyOn(authService, "getSessionUser")
      .mockResolvedValueOnce(fullUserRow as unknown as PublicUser);

    try {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", `${SESSION_COOKIE}=any-token`);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body.user).sort()).toEqual([
        "displayName",
        "email",
        "id",
        "role",
      ]);
      expect(response.body.user).not.toHaveProperty("passwordHash");
      expect(response.body.user).not.toHaveProperty("createdAt");
    } finally {
      spy.mockRestore();
    }
  });

  it("TEST-06: logout invalidates the seeded session cookie and deletes the session row", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER_EMAIL } });
    const token = randomBytes(32).toString("hex");
    await testPrisma.session.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });
    const cookie = `${SESSION_COOKIE}=${token}`;

    const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logout.status).toBe(204);

    const cleared = setCookies(logout).find((value) => value.startsWith(`${SESSION_COOKIE}=`));
    expect(cleared).toBeDefined();
    expect(cleared as string).toMatch(/^cb_session=;/);

    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(401);
    expect(me.body.error.code).toBe("UNAUTHENTICATED");

    expect(await testPrisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("TEST-06 (supporting): a session created by login stops working after logout", async () => {
    const loggedIn = await loginAs(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    expect(loggedIn.status).toBe(200);
    const cookie = sessionCookie(loggedIn);
    expect(cookie).toBeDefined();

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie as string);
    expect(logout.status).toBe(204);

    const me = await request(app).get("/api/auth/me").set("Cookie", cookie as string);
    expect(me.status).toBe(401);

    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER_EMAIL } });
    expect(await testPrisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("TEST-07: a session whose expiresAt is in the past is rejected with 401", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER_EMAIL } });
    const token = randomBytes(32).toString("hex");
    await testPrisma.session.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${SESSION_COOKIE}=${token}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(response.body).not.toHaveProperty("user");
    expect(await testPrisma.session.count({ where: { tokenHash: sha256(token) } })).toBe(0);
  });

  it("TEST-07 (supporting): sessionRepository.deleteExpired removes only expired rows", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER_EMAIL } });
    const expiredTokenHash = sha256(randomBytes(32).toString("hex"));
    const activeTokenHash = sha256(randomBytes(32).toString("hex"));

    await testPrisma.session.createMany({
      data: [
        {
          userId: user.id,
          tokenHash: expiredTokenHash,
          expiresAt: new Date(Date.now() - 60_000),
        },
        {
          userId: user.id,
          tokenHash: activeTokenHash,
          expiresAt: new Date(Date.now() + 60_000),
        },
      ],
    });

    await sessionRepository.deleteExpired();

    expect(await testPrisma.session.count({ where: { tokenHash: expiredTokenHash } })).toBe(0);
    expect(await testPrisma.session.count({ where: { tokenHash: activeTokenHash } })).toBe(1);
  });

  it("TEST-08: stored passwords are bcrypt hashes and no response exposes the hash", async () => {
    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: CUSTOMER_EMAIL } });
    expect(user.passwordHash).not.toBe(CUSTOMER_PASSWORD);
    expect(user.passwordHash.startsWith("$2")).toBe(true);

    const loggedIn = await loginAs(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    expect(loggedIn.status).toBe(200);
    expect(JSON.stringify(loggedIn.body)).not.toContain("passwordHash");
    expect(JSON.stringify(loggedIn.body)).not.toContain(user.passwordHash);

    const cookie = sessionCookie(loggedIn);
    expect(cookie).toBeDefined();
    const me = await request(app).get("/api/auth/me").set("Cookie", cookie as string);
    expect(me.status).toBe(200);
    expect(JSON.stringify(me.body)).not.toContain("passwordHash");
    expect(JSON.stringify(me.body)).not.toContain(user.passwordHash);
  });

  it("requireRole('OPERATOR') returns 401 without a cookie, 403 FORBIDDEN for CUSTOMER and 200 for OPERATOR", async () => {
    const guardedApp = createApp((server) => {
      server.get("/api/test-operator-only", requireAuth, requireRole("OPERATOR"), (_req, res) => {
        res.status(200).json({ allowed: true });
      });
    });

    const anonymous = await request(guardedApp).get("/api/test-operator-only");
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe("UNAUTHENTICATED");

    const customerLogin = await loginAs(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    const customerCookie = sessionCookie(customerLogin);
    expect(customerCookie).toBeDefined();

    const customerRes = await request(guardedApp)
      .get("/api/test-operator-only")
      .set("Cookie", customerCookie as string);
    expect(customerRes.status).toBe(403);
    expect(customerRes.body.error.code).toBe("FORBIDDEN");

    const operatorLogin = await loginAs(OPERATOR_EMAIL, OPERATOR_PASSWORD);
    const operatorCookie = sessionCookie(operatorLogin);
    expect(operatorCookie).toBeDefined();

    const operatorRes = await request(guardedApp)
      .get("/api/test-operator-only")
      .set("Cookie", operatorCookie as string);
    expect(operatorRes.status).toBe(200);
    expect(operatorRes.body).toEqual({ allowed: true });
  });
});
