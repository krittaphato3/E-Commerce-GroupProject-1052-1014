import type { OrderStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { AppError } from "../middleware/error.js";
import type { OrderCreateBody } from "../middleware/validate.js";
import { orderRepository } from "../repositories/orderRepository.js";
import { isOrderable } from "./menuRules.js";
import { calculateOrderTotal, formatOrderNumber } from "./orderRules.js";
import { assertTransition } from "./orderStateMachine.js";

interface StockRow {
  name: string;
  priceSatang: number;
}

export interface OrderLineView {
  menuItemId: number;
  itemName: string;
  unitPriceSatang: number;
  quantity: number;
  lineTotalSatang: number;
}

export interface OrderHistoryView {
  fromStatus: string | null;
  toStatus: string;
  actorRole: Role;
  createdAt: string;
}

export interface CustomerView {
  id: number;
  displayName: string;
}

export interface OrderDetailView {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalSatang: number;
  pickupNote: string | null;
  items: OrderLineView[];
  history: OrderHistoryView[];
  customer?: CustomerView;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummaryView {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalSatang: number;
  itemCount: number;
  createdAt: string;
}

export interface OperatorOrderSummaryView extends OrderSummaryView {
  customer: CustomerView;
}

type OrderWithDetail = Prisma.OrderGetPayload<{
  include: {
    items: true;
    history: true;
  };
}> & {
  customer?: { id: number; displayName: string };
};

function toDetailView(
  order: OrderWithDetail,
  options?: { includeCustomer?: boolean }
): OrderDetailView {
  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.id),
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalSatang: order.totalSatang,
    pickupNote: order.pickupNote,
    items: order.items.map((item) => ({
      menuItemId: item.menuItemId,
      itemName: item.itemName,
      unitPriceSatang: item.unitPriceSatang,
      quantity: item.quantity,
      lineTotalSatang: item.lineTotalSatang,
    })),
    history: order.history.map((entry) => ({
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      actorRole: entry.actorRole,
      createdAt: entry.createdAt.toISOString(),
    })),
    ...(options?.includeCustomer && order.customer
      ? {
          customer: {
            id: order.customer.id,
            displayName: order.customer.displayName,
          },
        }
      : {}),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

/**
 * BR-02/BR-05: one atomic statement reserves stock. Zero rows means the item is
 * disabled or the stock is short, which aborts the whole transaction with 409.
 */
async function reserveStock(
  tx: Prisma.TransactionClient,
  menuItemId: number,
  quantity: number
): Promise<StockRow> {
  const rows = await tx.$queryRaw<StockRow[]>`
    UPDATE "MenuItem"
       SET "stockQty" = "stockQty" - ${quantity}::int,
           "updatedAt" = NOW()
     WHERE "id" = ${menuItemId}::int
       AND "isAvailable" = true
       AND "stockQty" >= ${quantity}::int
    RETURNING "name", "priceSatang"
  `;

  if (rows.length === 0) {
    const item = await tx.menuItem.findUnique({
      where: { id: menuItemId },
      select: { name: true, stockQty: true, isAvailable: true },
    });

    const stockQty = item?.stockQty ?? 0;
    const available = item && isOrderable({ isAvailable: item.isAvailable, stockQty }, 1)
      ? stockQty
      : 0;
    const name = item?.name ?? "That item";

    let message = `${name} has only ${available} left.`;
    if (!item || !item.isAvailable) {
      message = `${name} is not available.`;
    } else if (stockQty === 0) {
      message = `${name} is sold out.`;
    }

    throw new AppError(409, "ITEM_UNAVAILABLE", message, {
      menuItemId,
      requested: quantity,
      available,
    });
  }

  return rows[0];
}

export const orderService = {
  /** FR-05/FR-06: validate, reserve stock atomically, snapshot prices and record history. */
  async create(customerId: number, input: OrderCreateBody): Promise<OrderDetailView> {
    // Process lines in ascending menuItemId order so concurrent orders lock rows in one order.
    const lines = [...input.items].sort((a, b) => a.menuItemId - b.menuItemId);

    const existing = await orderRepository.findExistingMenuItemIds(
      lines.map((line) => line.menuItemId)
    );
    const existingIds = new Set(existing.map((row) => row.id));
    const unknownLine = lines.find((line) => !existingIds.has(line.menuItemId));

    if (unknownLine) {
      throw new AppError(400, "VALIDATION_ERROR", "Unknown menu item", [
        { field: "items", message: `Menu item ${unknownLine.menuItemId} does not exist` },
      ]);
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderLines: OrderLineView[] = [];

      for (const line of lines) {
        // BR-04: the database returns the current name and price at reservation time.
        const reserved = await reserveStock(tx, line.menuItemId, line.quantity);

        orderLines.push({
          menuItemId: line.menuItemId,
          itemName: reserved.name,
          unitPriceSatang: reserved.priceSatang,
          quantity: line.quantity,
          lineTotalSatang: reserved.priceSatang * line.quantity,
        });
      }

      const totalSatang = calculateOrderTotal(orderLines);

      // BR-15: one history row from nothing to PENDING, actor is the ordering customer.
      return tx.order.create({
        data: {
          customerId,
          status: "PENDING",
          paymentStatus: "UNPAID",
          totalSatang,
          pickupNote: input.pickupNote ?? null,
          items: { create: orderLines },
          history: {
            create: {
              fromStatus: null,
              toStatus: "PENDING",
              actorId: customerId,
              actorRole: "CUSTOMER",
            },
          },
        },
        include: {
          items: { orderBy: { id: "asc" } },
          history: { orderBy: { id: "asc" } },
        },
      });
    });

    return toDetailView(order);
  },

  /** FR-07: the caller's own orders, newest first (at most 200). */
  async listMine(customerId: number): Promise<OrderSummaryView[]> {
    const orders = await orderRepository.findRecentByCustomer(customerId);

    return orders.map((order) => ({
      id: order.id,
      orderNumber: formatOrderNumber(order.id),
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalSatang: order.totalSatang,
      itemCount: order._count.items,
      createdAt: order.createdAt.toISOString(),
    }));
  },

  /** FR-08/AC-32/AC-33: operator order list, oldest first, with optional status filter (at most 200). */
  async listForOperator(status?: OrderStatus): Promise<OperatorOrderSummaryView[]> {
    const orders = await orderRepository.findAllForOperator(status);

    return orders.map((order) => ({
      id: order.id,
      orderNumber: formatOrderNumber(order.id),
      customer: {
        id: order.customer.id,
        displayName: order.customer.displayName,
      },
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalSatang: order.totalSatang,
      itemCount: order._count.items,
      createdAt: order.createdAt.toISOString(),
    }));
  },

  /** FR-09/BR-06/BR-15/AC-34..37/AC-40: accept a PENDING order with atomic state transition and history. */
  async accept(orderId: number, operatorId: number): Promise<OrderDetailView> {
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new AppError(404, "NOT_FOUND", "Order not found");
      }

      assertTransition(existing.status, "ACCEPTED");

      const updated = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "ACCEPTED" },
      });

      if (updated.count === 0) {
        const latest = await tx.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });

        if (!latest) {
          throw new AppError(404, "NOT_FOUND", "Order not found");
        }

        throw new AppError(
          409,
          "INVALID_TRANSITION",
          `Cannot transition order from ${latest.status} to ACCEPTED`,
          { from: latest.status, to: "ACCEPTED" }
        );
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: "PENDING",
          toStatus: "ACCEPTED",
          actorId: operatorId,
          actorRole: "OPERATOR",
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          items: { orderBy: { id: "asc" } },
          history: { orderBy: { id: "asc" } },
          customer: { select: { id: true, displayName: true } },
        },
      });
    });

    return toDetailView(order, { includeCustomer: true });
  },

  /** FR-06/BR-07: the owner customer or any operator may read an order. */
  async getForViewer(
    orderId: number,
    viewer: { id: number; role: Role }
  ): Promise<OrderDetailView> {
    const order = await orderRepository.findDetailById(orderId);

    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order not found");
    }

    if (viewer.role !== "OPERATOR" && order.customerId !== viewer.id) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to view this order");
    }

    return toDetailView(order, { includeCustomer: viewer.role === "OPERATOR" });
  },
};
