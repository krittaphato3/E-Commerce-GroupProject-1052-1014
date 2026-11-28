import { describe, it, expect } from "vitest";
import { orderRejectSchema } from "./validate.js";

describe("F-09 order rejection schema (AC-96, BR-12)", () => {
  it.each([
    ["4 characters", false, "a".repeat(4)],
    ["5 characters", true, "a".repeat(5)],
    ["200 characters", true, "a".repeat(200)],
    ["201 characters", false, "a".repeat(201)],
    ["whitespace only", false, "     "],
    ["an empty string", false, ""],
    ["4 characters after trimming", false, "  abcd  "],
    ["5 characters after trimming", true, "  abcde  "],
    ["200 characters after trimming", true, `  ${"a".repeat(200)}  `],
  ])("TEST-96: %s, accepted: %s", (label, accepted, reason) => {
    expect(orderRejectSchema.safeParse({ reason }).success, label).toBe(accepted);
  });

  it("TEST-96: an accepted reason is trimmed", () => {
    expect(orderRejectSchema.parse({ reason: "  abcde  " })).toEqual({ reason: "abcde" });
  });

  it.each([
    ["a missing reason", {}],
    ["a number", { reason: 123456 }],
    ["null", { reason: null }],
    ["an extra field", { reason: "Valid reason", note: "x" }],
  ])("TEST-96: %s is rejected", (label, body) => {
    expect(orderRejectSchema.safeParse(body).success, label).toBe(false);
  });
});
