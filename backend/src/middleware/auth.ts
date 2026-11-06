import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { authService } from "../services/authService.js";
import { AppError } from "./error.js";

export const SESSION_COOKIE_NAME = "cb_session";

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  role: Role;
}

/** Loads the user from the cb_session cookie or rejects with 401 UNAUTHENTICATED. */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const user =
    typeof token === "string" && token.length > 0 ? await authService.getSessionUser(token) : null;

  if (!user) {
    next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    return;
  }

  req.user = user;
  next();
}

/** Rejects with 403 FORBIDDEN unless the authenticated user has one of the roles. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action"));
      return;
    }

    next();
  };
}
