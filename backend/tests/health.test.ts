import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Health API Endpoint (R-03)", () => {
  it("GET /api/health returns 200 OK with status: ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("version");
  });
});

describe("Readiness API Endpoint", () => {
  it("GET /api/ready returns 200 when the database is reachable", async () => {
    const response = await request(app).get("/api/ready");

    expect(response.status).toBe(200);
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
