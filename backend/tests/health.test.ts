import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { checkDatabaseReady } from "../src/routes/health.js";

describe("Health API Endpoint (R-03)", () => {
  const originalAppVersion = process.env.APP_VERSION;
  const originalGitSha = process.env.GIT_SHA;

  afterEach(() => {
    if (originalAppVersion === undefined) delete process.env.APP_VERSION;
    else process.env.APP_VERSION = originalAppVersion;

    if (originalGitSha === undefined) delete process.env.GIT_SHA;
    else process.env.GIT_SHA = originalGitSha;
  });

  it("GET /api/health returns 200 OK with status: ok and default version 1.0.0", async () => {
    delete process.env.APP_VERSION;
    delete process.env.GIT_SHA;

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", version: "1.0.0" });
  });

  it("GET /api/health exposes APP_VERSION over GIT_SHA when configured", async () => {
    process.env.GIT_SHA = "abc1234";
    process.env.APP_VERSION = "deadbee";

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", version: "deadbee" });
  });

  it("GET /api/health falls back to GIT_SHA when APP_VERSION is unset", async () => {
    delete process.env.APP_VERSION;
    process.env.GIT_SHA = "cafebabe";

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", version: "cafebabe" });
  });
});

describe("Readiness API Endpoint", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("GET /api/ready returns 200 when the database is reachable", async () => {
    const response = await request(app).get("/api/ready");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual({ status: "ready", database: "ok" });
  });

  it("GET /api/ready returns 503 when the database query fails", async () => {
    const { prisma } = await import("../src/db/prisma.js");
    const spy = vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("down"));

    const response = await request(app).get("/api/ready");
    spy.mockRestore();

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "unavailable", database: "unreachable" });
  });
});

describe("Readiness timeout and logging", () => {
  it("returns false (503 path) when the database check hangs past the timeout", async () => {
    const { prisma } = await import("../src/db/prisma.js");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const querySpy = vi
      .spyOn(prisma, "$queryRaw")
      .mockImplementationOnce(() => new Promise(() => {}) as never);

    const started = Date.now();
    const ready = await checkDatabaseReady(50);
    querySpy.mockRestore();

    expect(ready).toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain("timed out");
    errorSpy.mockRestore();
  });

  it("logs only the code and a redacted message, never a connection string or the error object", async () => {
    const { prisma } = await import("../src/db/prisma.js");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = Object.assign(
      new Error("cannot reach postgresql://app:s3cret@db.internal:5432/shop"),
      { code: "P1001" }
    );
    const querySpy = vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(failure);

    expect(await checkDatabaseReady()).toBe(false);
    querySpy.mockRestore();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = errorSpy.mock.calls[0];
    expect(logged).toHaveLength(1);
    expect(typeof logged[0]).toBe("string");
    expect(logged[0]).toContain("P1001");
    expect(logged[0]).not.toContain("s3cret");
    expect(logged[0]).not.toContain("postgresql://");
    errorSpy.mockRestore();
  });
});
