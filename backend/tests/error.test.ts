import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { createApp } from "../src/app.js";
import { AppError } from "../src/middleware/error.js";

describe("Central Error Handler (R-02, AC-44, NFR-07)", () => {
  it("Malformed JSON body returns 400 VALIDATION_ERROR in standard format", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{ malformed json: true, ");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: expect.stringContaining("Malformed JSON"),
      },
    });
  });

  it("Unexpected server error returns 500 INTERNAL_ERROR with generic message and no stack trace, SQL, or 'Prisma'", async () => {
    const app = createApp((server) => {
      server.get("/api/test-crash", () => {
        throw new Error("Secret SQL query: SELECT * FROM sensitive_table; PrismaClientKnownRequestError");
      });
    });

    const response = await request(app).get("/api/test-crash");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong.",
      },
    });
    // Check that sensitive tokens are never in the response body
    const bodyStr = JSON.stringify(response.body);
    expect(bodyStr).not.toContain("stack");
    expect(bodyStr).not.toContain("SELECT");
    expect(bodyStr).not.toContain("Prisma");
  });

  it("Custom AppError returns defined status code and error details", async () => {
    const app = createApp((server) => {
      server.get("/api/test-app-error", () => {
        throw new AppError(404, "NOT_FOUND", "Resource was not found", { id: 123 });
      });
    });

    const response = await request(app).get("/api/test-app-error");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Resource was not found",
        details: { id: 123 },
      },
    });
  });

  it("A rejected async handler reaches the error handler as 500 INTERNAL_ERROR", async () => {
    const app = createApp((server) => {
      server.get("/api/test-async-crash", async () => {
        throw new Error("PrismaClientKnownRequestError: SELECT * FROM sensitive_table");
      });
    });

    const response = await request(app).get("/api/test-async-crash");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong.",
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("Prisma");
  });

  it("A rejected async handler throwing AppError keeps its status code", async () => {
    const app = createApp((server) => {
      server.get("/api/test-async-app-error", async () => {
        throw new AppError(409, "CONFLICT", "Stock changed while ordering");
      });
    });

    const response = await request(app).get("/api/test-async-app-error");

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "Stock changed while ordering",
      },
    });
  });

  it("TEST-44: POST /api/auth/login with body '{bad json' returns 400 VALIDATION_ERROR in standard error shape", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: expect.stringContaining("Malformed JSON"),
      },
    });
  });

  it("TEST-44: failing route throwing new Error('db password leak') returns 500 INTERNAL_ERROR without 'db password leak', 'stack', 'SELECT' or 'Prisma'", async () => {
    const app = createApp((server) => {
      server.get("/api/test-db-leak", () => {
        throw new Error("db password leak");
      });
    });

    const response = await request(app).get("/api/test-db-leak");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong.",
      },
    });
    const bodyStr = JSON.stringify(response.body);
    expect(bodyStr).not.toContain("db password leak");
    expect(bodyStr).not.toContain("stack");
    expect(bodyStr).not.toContain("SELECT");
    expect(bodyStr).not.toContain("Prisma");
  });
});
