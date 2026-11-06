import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.js";
import { SESSION_COOKIE_NAME } from "../middleware/auth.js";
import { authService, SESSION_TTL_MS } from "../services/authService.js";
import type { LoginBody } from "../middleware/validate.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: env.COOKIE_SECURE,
};

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginBody;
  const result = await authService.login(email, password);

  if (!result) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  res.cookie(SESSION_COOKIE_NAME, result.token, {
    ...cookieOptions,
    maxAge: SESSION_TTL_MS,
  });
  res.status(200).json({ user: result.user });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (typeof token === "string" && token.length > 0) {
    await authService.logout(token);
  }

  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
  res.status(204).send();
}

export function me(req: Request, res: Response): void {
  const { id, email, displayName, role } = req.user!;
  res.status(200).json({ user: { id, email, displayName, role } });
}
