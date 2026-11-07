import type { OrderStatus } from "@prisma/client";
import { AppError } from "../middleware/error.js";

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING: ["ACCEPTED"],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(
      409,
      "INVALID_TRANSITION",
      `Cannot transition order from ${from} to ${to}`,
      { from, to }
    );
  }
}
