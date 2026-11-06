import { describe, it, expect } from "vitest";
import { roleHome } from "./roles";

describe("roleHome", () => {
  it("routes CUSTOMER to /menu", () => {
    expect(roleHome("CUSTOMER")).toBe("/menu");
  });

  it("routes OPERATOR to /operator/orders", () => {
    expect(roleHome("OPERATOR")).toBe("/operator/orders");
  });
});
