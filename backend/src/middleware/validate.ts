import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "./error.js";

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(128),
  })
  .strict();

export type LoginBody = z.infer<typeof loginSchema>;

/** Validates a body against a strict zod schema and returns 400 VALIDATION_ERROR on failure. */
export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      next(new AppError(400, "VALIDATION_ERROR", "Invalid request body", details));
      return;
    }

    req.body = result.data;
    next();
  };
}
