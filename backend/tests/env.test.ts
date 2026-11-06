import { describe, it, expect } from "vitest";
import { parseEnv, DEV_SESSION_SECRET } from "../src/config/env.js";

const baseEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/campusbites?schema=public",
};

describe("Environment configuration (SESSION_SECRET hardening)", () => {
  it("uses the development default outside production", () => {
    const env = parseEnv({ ...baseEnv, NODE_ENV: "development" });

    expect(env.SESSION_SECRET).toBe(DEV_SESSION_SECRET);
  });

  it("rejects the committed default secret when NODE_ENV=production", () => {
    expect(() => parseEnv({ ...baseEnv, NODE_ENV: "production" })).toThrow(
      /SESSION_SECRET must be set to a unique value in production/
    );
  });

  it("rejects a short secret when NODE_ENV=production", () => {
    expect(() =>
      parseEnv({ ...baseEnv, NODE_ENV: "production", SESSION_SECRET: "too-short" })
    ).toThrow(/SESSION_SECRET must be at least 32 characters in production/);
  });

  it("accepts a unique secret of at least 32 characters in production", () => {
    const secret = "a".repeat(32);
    const env = parseEnv({ ...baseEnv, NODE_ENV: "production", SESSION_SECRET: secret });

    expect(env.SESSION_SECRET).toBe(secret);
  });
});
