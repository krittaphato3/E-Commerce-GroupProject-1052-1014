import { describe, it, expect } from "vitest";
import { orderPaymentSchema } from "./validate.js";

describe("F-07 payment schema (AC-70)", () => {
  it("TEST-70: accepts a positive integer amountSatang", () => {
    expect(orderPaymentSchema.safeParse({ amountSatang: 15000 }).success).toBe(true);
  });

  it.each([
    ["no body", undefined],
    ["an empty object", {}],
    ["zero", { amountSatang: 0 }],
    ["a negative amount", { amountSatang: -15000 }],
    ["a decimal", { amountSatang: 150.5 }],
    ["a string", { amountSatang: "15000" }],
    ["an extra paymentStatus field", { amountSatang: 15000, paymentStatus: "PAID" }],
  ])("TEST-70: rejects %s", (_label, body) => {
    expect(orderPaymentSchema.safeParse(body).success).toBe(false);
  });
});
