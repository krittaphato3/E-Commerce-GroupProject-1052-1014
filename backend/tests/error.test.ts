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
});
