import { describe, it, expect } from "vitest";
import { AppError } from "../middleware/error.js";

const ACCEPTED_UNPAID = {
  status: "ACCEPTED",
  paymentStatus: "UNPAID",
  totalSatang: 15000,
} as const;

// Loaded inside each case, so a missing module fails every TEST-69 case by name
// instead of failing the file before any case is listed.
const loadRule = async () => (await import("./paymentRules.js")).assertPaymentAllowed;

function captureError(run: () => void): AppError {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    return error as AppError;
  }
  throw new Error("Expected assertPaymentAllowed to throw");
}

describe("F-07 payment rules (AC-69, BR-11)", () => {
  it("TEST-69: the exact total 15000 passes", async () => {
    const assertPaymentAllowed = await loadRule();
    expect(() => assertPaymentAllowed(ACCEPTED_UNPAID, 15000)).not.toThrow();
  });

  it.each([14999, 15001])("TEST-69: %i is rejected with 400 naming amountSatang", async (amount) => {
    const assertPaymentAllowed = await loadRule();
    const error = captureError(() => assertPaymentAllowed(ACCEPTED_UNPAID, amount));

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Payment amount must equal the order total.");
    expect(error.details).toEqual([{ field: "amountSatang", message: "Must equal 15000" }]);
  });

  it.each([
    ["PENDING", "UNPAID"],
    ["PREPARING", "UNPAID"],
    ["CANCELLED", "UNPAID"],
    ["ACCEPTED", "PAID"],
    ["ACCEPTED", "REFUNDED"],
  ] as const)(
    "TEST-69: status %s with payment %s is 409, checked before the amount (DEC-36)",
    async (status, paymentStatus) => {
      const assertPaymentAllowed: Awaited<ReturnType<typeof loadRule>> = await loadRule();
      // A wrong amount is passed on purpose: the state check must win.
      const error = captureError(() =>
        assertPaymentAllowed({ status, paymentStatus, totalSatang: 15000 }, 1)
      );

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("INVALID_TRANSITION");
      expect(error.details).toEqual({ from: paymentStatus, to: "PAID", orderStatus: status });
    }
  );
});
