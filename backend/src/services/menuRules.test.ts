import { describe, it, expect } from "vitest";
import { isOrderable } from "./menuRules.js";

describe("TEST-11: isOrderable availability rule (AC-11, BR-02)", () => {
  const enabledWithStock = { isAvailable: true, stockQty: 5 };

  it("returns true only when the item is enabled and its stock covers the quantity", () => {
    expect(isOrderable(enabledWithStock, 1)).toBe(true);
    expect(isOrderable({ isAvailable: true, stockQty: 0 }, 1)).toBe(false);
    expect(isOrderable({ isAvailable: false, stockQty: 5 }, 1)).toBe(false);
    expect(isOrderable({ isAvailable: false, stockQty: 0 }, 1)).toBe(false);
    expect(isOrderable(enabledWithStock, 6)).toBe(false);
  });

  it("treats the exact stock quantity as orderable and one unit above as not orderable", () => {
    expect(isOrderable(enabledWithStock, 5)).toBe(true);
    expect(isOrderable({ isAvailable: true, stockQty: 1 }, 1)).toBe(true);
    expect(isOrderable({ isAvailable: true, stockQty: 1 }, 2)).toBe(false);
  });

  it("never reports a zero or negative quantity as an orderable line", () => {
    expect(isOrderable(enabledWithStock, 0)).toBe(false);
    expect(isOrderable(enabledWithStock, -1)).toBe(false);
  });
});
