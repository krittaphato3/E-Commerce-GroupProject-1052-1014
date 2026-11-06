import { createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { sessionRepository } from "../repositories/sessionRepository.js";
import { userRepository, type PublicUser } from "../repositories/userRepository.js";
import { hashPassword, verifyPassword } from "./password.js";

const SESSION_TOKEN_BYTES = 32;

export const SESSION_TTL_MS = env.SESSION_TTL_HOURS * 60 * 60 * 1000;

/**
 * Lazily creates and caches a dummy bcrypt hash at the configured BCRYPT_ROUNDS
 * cost so unknown-email login attempts spend the same hashing work as existing users.
 */
let dummyHashPromise: Promise<string> | null = null;

function dummyPasswordHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(
    randomBytes(SESSION_TOKEN_BYTES).toString("base64url"),
    env.BCRYPT_ROUNDS
  );
  return dummyHashPromise;
}

export interface LoginResult {
  user: PublicUser;
  token: string;
  expiresAt: Date;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const authService = {
  /** Returns null for both an unknown email and a wrong password (DEC-05, FR-01). */
  async login(email: string, password: string): Promise<LoginResult | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      await verifyPassword(password, await dummyPasswordHash());
      return null;
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return null;
    }

    const token = randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await sessionRepository.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      token,
      expiresAt,
    };
  },

  /** Idempotent: deleting no session is still a successful logout. */
  async logout(token: string): Promise<void> {
    await sessionRepository.deleteByTokenHash(hashToken(token));
  },

  async getSessionUser(token: string): Promise<PublicUser | null> {
    const session = await sessionRepository.findValid(hashToken(token), new Date());
    return session?.user ?? null;
  },
};
