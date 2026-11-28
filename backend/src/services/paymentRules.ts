import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { AppError } from "../middleware/error.js";

export interface PayableOrder {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalSatang: number;
}

export function paymentTransitionError(
  order: Pick<PayableOrder, "status" | "paymentStatus">
): AppError {
  return new AppError(
    409,
    "INVALID_TRANSITION",
    `Cannot pay an order with status ${order.status} and payment ${order.paymentStatus}`,
    { from: order.paymentStatus, to: "PAID", orderStatus: order.status }
  );
}

/**
 * BR-11: only an ACCEPTED, UNPAID order can be paid, and only with its exact total.
 * DEC-36: the state is checked before the amount.
 */
export function assertPaymentAllowed(order: PayableOrder, amountSatang: number): void {
  if (order.status !== "ACCEPTED" || order.paymentStatus !== "UNPAID") {
    throw paymentTransitionError(order);
  }

  if (amountSatang !== order.totalSatang) {
    throw new AppError(400, "VALIDATION_ERROR", "Payment amount must equal the order total.", [
      { field: "amountSatang", message: `Must equal ${order.totalSatang}` },
    ]);
  }
}
