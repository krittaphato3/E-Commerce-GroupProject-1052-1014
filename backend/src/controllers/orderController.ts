import type { Request, Response } from "express";
import { AppError } from "../middleware/error.js";
import {
  parseOrderStatusQuery,
  parsePositiveIntegerParam,
  type OrderCreateBody,
} from "../middleware/validate.js";
import { orderService } from "../services/orderService.js";

/** POST /api/orders — Customer only (FR-05, AC-14). */
export async function createOrder(req: Request, res: Response): Promise<void> {
  const order = await orderService.create(req.user!.id, req.body as OrderCreateBody);
  res.status(201).location(`/api/orders/${order.id}`).json({ order });
}

/** GET /api/orders — Operator only (FR-08, AC-32, AC-33). */
export async function listOrders(req: Request, res: Response): Promise<void> {
  const status = parseOrderStatusQuery(req.query.status);
  const orders = await orderService.listForOperator(status);
  res.status(200).json({ orders });
}

/** GET /api/orders/mine — the caller's own orders (FR-07, AC-28). */
export async function listMyOrders(req: Request, res: Response): Promise<void> {
  const orders = await orderService.listMine(req.user!.id);
  res.status(200).json({ orders });
}

/** GET /api/orders/:id — owner Customer or any Operator (FR-06, AC-27). */
export async function getOrder(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const orderId = parsePositiveIntegerParam(typeof rawId === "string" ? rawId : undefined);

  if (orderId === null) {
    throw new AppError(400, "VALIDATION_ERROR", "Order id must be a positive integer");
  }

  const order = await orderService.getForViewer(orderId, req.user!);
  res.status(200).json({ order });
}

/** POST /api/orders/:id/accept — Operator only (FR-09, AC-34..37, AC-40). */
export async function acceptOrder(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const orderId = parsePositiveIntegerParam(typeof rawId === "string" ? rawId : undefined);

  if (orderId === null) {
    throw new AppError(400, "VALIDATION_ERROR", "Order id must be a positive integer");
  }

  const order = await orderService.accept(orderId, req.user!.id);
  res.status(200).json({ order });
}
