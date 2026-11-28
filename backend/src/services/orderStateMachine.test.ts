import { describe, it, expect } from "vitest";
import { assertTransition, canTransition } from "./orderStateMachine.js";
import { AppError } from "../middleware/error.js";

describe("orderStateMachine (AC-35, BR-06)", () => {
  it("TEST-35 (unit): allows PENDING -> ACCEPTED", () => {
    expect(canTransition("PENDING", "ACCEPTED")).toBe(true);
    expect(() => assertTransition("PENDING", "ACCEPTED")).not.toThrow();
  });

  it("TEST-35 (unit): rejects ACCEPTED -> ACCEPTED and ACCEPTED -> PENDING with 409 INVALID_TRANSITION", () => {
    expect(canTransition("ACCEPTED", "ACCEPTED")).toBe(false);
    expect(canTransition("ACCEPTED", "PENDING")).toBe(false);

    try {
      assertTransition("ACCEPTED", "ACCEPTED");
      expect.fail("Expected assertTransition to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(409);
      expect(appErr.code).toBe("INVALID_TRANSITION");
      expect(appErr.details).toEqual({ from: "ACCEPTED", to: "ACCEPTED" });
    }

    try {
      assertTransition("ACCEPTED", "PENDING");
      expect.fail("Expected assertTransition to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(409);
      expect(appErr.code).toBe("INVALID_TRANSITION");
      expect(appErr.details).toEqual({ from: "ACCEPTED", to: "PENDING" });
    }
  });

  it("TEST-35 (unit): rejects transitions from other non-PENDING statuses to ACCEPTED", () => {
    const statuses = [
      "REJECTED",
      "CANCELLED",
      "PREPARING",
      "READY",
      "COMPLETED",
    ] as const;

    for (const status of statuses) {
      expect(canTransition(status, "ACCEPTED")).toBe(false);
      expect(() => assertTransition(status, "ACCEPTED")).toThrowError(AppError);
    }
  });
});

describe("orderStateMachine cancellation (AC-60, BR-06, BR-10)", () => {
  it.each([
    ["PENDING", true],
    ["ACCEPTED", false],
    ["PREPARING", false],
    ["READY", false],
    ["COMPLETED", false],
    ["REJECTED", false],
    ["CANCELLED", false],
  ] as const)("TEST-60: %s -> CANCELLED allowed: %s", (from, allowed) => {
    expect(canTransition(from, "CANCELLED")).toBe(allowed);

    if (allowed) {
      expect(() => assertTransition(from, "CANCELLED")).not.toThrow();
      return;
    }

    let thrown: unknown;
    try {
      assertTransition(from, "CANCELLED");
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(AppError);
    expect(thrown).toMatchObject({
      statusCode: 409,
      code: "INVALID_TRANSITION",
      details: { from, to: "CANCELLED" },
    });
  });
});
