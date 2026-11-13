import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("TEST-08: Password hashing helper (AC-08, NFR-03)", () => {
  const plaintext = "correct horse battery staple";

  it("produces a bcrypt hash that is not the plaintext", async () => {
    const hash = await hashPassword(plaintext);

    expect(hash).not.toBe(plaintext);
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword(plaintext);

    await expect(verifyPassword(plaintext, hash)).resolves.toBe(true);
    await expect(verifyPassword(`${plaintext}-wrong`, hash)).resolves.toBe(false);
  });

  it("salts each hash so the same password hashes differently", async () => {
    const first = await hashPassword(plaintext);
    const second = await hashPassword(plaintext);

    expect(first).not.toBe(second);
  });
});
