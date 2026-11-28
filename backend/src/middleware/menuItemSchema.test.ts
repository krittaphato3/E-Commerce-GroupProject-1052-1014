import { describe, it, expect } from "vitest";
import { menuItemCreateSchema, menuItemUpdateSchema } from "./validate.js";

const VALID_CREATE = {
  name: "Iced Coffee",
  description: "Cold brew with milk",
  priceSatang: 3500,
  stockQty: 20,
};

describe("F-05 menu item schemas (AC-51, AC-52)", () => {
  it("TEST-51: accepts priceSatang boundaries 1 and 1,000,000 and rejects invalid values", () => {
    for (const valid of [1, 1_000_000]) {
      expect(menuItemCreateSchema.safeParse({ ...VALID_CREATE, priceSatang: valid }).success).toBe(
        true
      );
      expect(menuItemUpdateSchema.safeParse({ priceSatang: valid }).success).toBe(true);
    }

    for (const invalid of [0, -1, 1_000_001, 1.5, "6000"]) {
      expect(menuItemCreateSchema.safeParse({ ...VALID_CREATE, priceSatang: invalid }).success).toBe(
        false
      );
      expect(menuItemUpdateSchema.safeParse({ priceSatang: invalid }).success).toBe(false);
    }
  });

  it("TEST-52: accepts stockQty boundaries 0 and 10,000 and rejects invalid values", () => {
    for (const valid of [0, 10_000]) {
      expect(menuItemCreateSchema.safeParse({ ...VALID_CREATE, stockQty: valid }).success).toBe(
        true
      );
      expect(menuItemUpdateSchema.safeParse({ stockQty: valid }).success).toBe(true);
    }

    for (const invalid of [-1, 10_001, 1.5, "5"]) {
      expect(menuItemCreateSchema.safeParse({ ...VALID_CREATE, stockQty: invalid }).success).toBe(
        false
      );
      expect(menuItemUpdateSchema.safeParse({ stockQty: invalid }).success).toBe(false);
    }
  });
});
