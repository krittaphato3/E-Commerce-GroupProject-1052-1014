import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "./error.js";

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z
      .string()
      .min(1)
      .refine((val) => Buffer.byteLength(val, "utf8") <= 72, {
        message: "Password must be at most 72 bytes",
      }),
  })
  .strict();

export type LoginBody = z.infer<typeof loginSchema>;

export const orderItemSchema = z
  .object({
    menuItemId: z.number().int().positive(),
    // BR-01: integer quantity from 1 to 10, never a string or a decimal.
    quantity: z.number().int().min(1).max(10),
  })
  .strict();

export const orderCreateSchema = z
  .object({
    // BR-01: 1 to 10 lines.
    items: z.array(orderItemSchema).min(1).max(10),
    // BR-01: empty notes become null; 200 characters is the maximum.
    pickupNote: z
      .string()
      .trim()
      .max(200)
      .transform((value) => (value.length === 0 ? null : value))
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seen = new Set<number>();

    value.items.forEach((item, index) => {
      if (seen.has(item.menuItemId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "menuItemId"],
          message: "Each menu item may appear only once",
        });
      }
      seen.add(item.menuItemId);
    });
  });

export type OrderCreateBody = z.infer<typeof orderCreateSchema>;

/** Parses a positive integer route parameter, returning null when it is not one. */
export function parsePositiveIntegerParam(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

/** Validates a body against a strict zod schema and returns 400 VALIDATION_ERROR on failure. */
export function validateBody<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>) {
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
