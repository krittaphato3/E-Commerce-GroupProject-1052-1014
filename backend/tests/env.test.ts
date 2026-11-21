import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/config/env.js";
import { resolveCorsOptions } from "../src/config/cors.js";

const baseEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/campusbites?schema=public",
};

describe("Environment configuration (parseEnv)", () => {
  it("applies defaults for PORT, NODE_ENV, SESSION_TTL_HOURS, BCRYPT_ROUNDS and COOKIE_SECURE", () => {
    const parsed = parseEnv({ ...baseEnv });

    expect(parsed.PORT).toBe(3000);
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.SESSION_TTL_HOURS).toBe(8);
    expect(parsed.BCRYPT_ROUNDS).toBe(10);
    expect(parsed.COOKIE_SECURE).toBe(false);
    expect(parsed).not.toHaveProperty("SESSION_SECRET");
  });

  it("allows NODE_ENV=production with DATABASE_URL alone (opaque sessions do not use SESSION_SECRET)", () => {
    const parsed = parseEnv({ ...baseEnv, NODE_ENV: "production" });

    expect(parsed.NODE_ENV).toBe("production");
    expect(parsed).not.toHaveProperty("SESSION_SECRET");
  });

  it("enforces BCRYPT_ROUNDS integer bounds between 4 and 15", () => {
    expect(parseEnv({ ...baseEnv, BCRYPT_ROUNDS: "4" }).BCRYPT_ROUNDS).toBe(4);
    expect(parseEnv({ ...baseEnv, BCRYPT_ROUNDS: "15" }).BCRYPT_ROUNDS).toBe(15);
    expect(() => parseEnv({ ...baseEnv, BCRYPT_ROUNDS: "3" })).toThrow();
    expect(() => parseEnv({ ...baseEnv, BCRYPT_ROUNDS: "16" })).toThrow();
  });

  it("defaults COOKIE_SECURE to true in production and false elsewhere; an explicit value wins", () => {
    expect(parseEnv({ ...baseEnv, NODE_ENV: "production" }).COOKIE_SECURE).toBe(true);
    expect(parseEnv({ ...baseEnv, NODE_ENV: "development" }).COOKIE_SECURE).toBe(false);
    expect(parseEnv({ ...baseEnv, NODE_ENV: "test" }).COOKIE_SECURE).toBe(false);
    expect(parseEnv({ ...baseEnv, NODE_ENV: "production", COOKIE_SECURE: "false" }).COOKIE_SECURE).toBe(false);
    expect(parseEnv({ ...baseEnv, NODE_ENV: "development", COOKIE_SECURE: "true" }).COOKIE_SECURE).toBe(true);
  });
});

describe("CORS policy (resolveCorsOptions)", () => {
  it("uses the dev origin with credentials outside production when CLIENT_ORIGIN is unset", () => {
    expect(resolveCorsOptions({ NODE_ENV: "development" })).toEqual({
      origin: "http://localhost:5173",
      credentials: true,
    });
  });

  it("disables cross-origin CORS in production when CLIENT_ORIGIN is unset", () => {
    expect(resolveCorsOptions({ NODE_ENV: "production" })).toEqual({ origin: false });
  });

  it("uses an explicit CLIENT_ORIGIN with credentials in any environment", () => {
    expect(
      resolveCorsOptions({ NODE_ENV: "production", CLIENT_ORIGIN: "https://app.example.com" })
    ).toEqual({ origin: "https://app.example.com", credentials: true });
  });
});
