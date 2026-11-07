import { describe, it, expect } from "vitest";
import { calculateOrderTotal, formatOrderNumber } from "./orderRules.js";
import { orderCreateSchema } from "../middleware/validate.js";

describe("TEST-15 (unit): calculateOrderTotal (AC-15, BR-03)", () => {
  it("sums unit price times quantity for every line", () => {
    expect(
      calculateOrderTotal([
        { unitPriceSatang: 6000, quantity: 2 },
        { unitPriceSatang: 3000, quantity: 1 },
      ])
    ).toBe(15000);
  });

  it("returns 0 for an empty line list", () => {
    expect(calculateOrderTotal([])).toBe(0);
  });

  it("formats the order number as CB- plus the id padded to six digits", () => {
    expect(formatOrderNumber(1)).toBe("CB-000001");
    expect(formatOrderNumber(12)).toBe("CB-000012");
    expect(formatOrderNumber(999999)).toBe("CB-999999");
    expect(formatOrderNumber(1234567)).toBe("CB-1234567");
  });
});

describe("TEST-18 (unit): the strict order schema (AC-16, AC-18, BR-01)", () => {
  it("accepts a valid order body", () => {
    const result = orderCreateSchema.safeParse({
      items: [
        { menuItemId: 1, quantity: 2 },
        { menuItemId: 4, quantity: 1 },
      ],
      pickupNote: "Pickup at 12:30",
    });

    expect(result.success).toBe(true);
  });

  it.each([0, -1, 1.5, "2", 11])("rejects the invalid quantity %s", (quantity) => {
    const result = orderCreateSchema.safeParse({ items: [{ menuItemId: 1, quantity }] });
    expect(result.success).toBe(false);
  });

  it("rejects an empty item list, more than ten lines and a duplicated item", () => {
    expect(orderCreateSchema.safeParse({ items: [] }).success).toBe(false);

    const elevenLines = Array.from({ length: 11 }, (_, index) => ({
      menuItemId: index + 1,
      quantity: 1,
    }));
    expect(orderCreateSchema.safeParse({ items: elevenLines }).success).toBe(false);

    expect(
      orderCreateSchema.safeParse({
        items: [
          { menuItemId: 1, quantity: 1 },
          { menuItemId: 1, quantity: 2 },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects client-supplied prices, totals, status and unknown fields", () => {
    expect(
      orderCreateSchema.safeParse({
        items: [{ menuItemId: 1, quantity: 1 }],
        totalSatang: 1,
      }).success
    ).toBe(false);

    expect(
      orderCreateSchema.safeParse({
        items: [{ menuItemId: 1, quantity: 1, unitPriceSatang: 1 }],
      }).success
    ).toBe(false);

    expect(
      orderCreateSchema.safeParse({
        items: [{ menuItemId: 1, quantity: 1 }],
        status: "ACCEPTED",
      }).success
    ).toBe(false);
  });

  it("enforces the pickup note boundary of 200 characters", () => {
    const withNote = (length: number) =>
      orderCreateSchema.safeParse({
        items: [{ menuItemId: 1, quantity: 1 }],
        pickupNote: "n".repeat(length),
      });

    expect(withNote(200).success).toBe(true);
    expect(withNote(201).success).toBe(false);
  });
});
