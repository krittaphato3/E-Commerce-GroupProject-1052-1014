import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

export async function hashPassword(
  plainPassword: string,
  rounds: number = env.BCRYPT_ROUNDS
): Promise<string> {
  return bcrypt.hash(plainPassword, rounds);
}

export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
