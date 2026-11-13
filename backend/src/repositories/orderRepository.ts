import type { OrderStatus } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export const orderRepository = {
  /** Used to return 400 for an unknown menu item before the transaction starts. */
  findExistingMenuItemIds(ids: number[]): Promise<Array<{ id: number }>> {
    return prisma.menuItem.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  },

  findDetailById(id: number) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: { orderBy: { id: "asc" } },
        history: { orderBy: { id: "asc" } },
        customer: { select: { id: true, displayName: true } },
      },
    });
  },

  findRecentByCustomer(customerId: number) {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 200,
      include: { _count: { select: { items: true } } },
    });
  },

  findAllForOperator(status?: OrderStatus) {
    return prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 200,
      include: {
        customer: { select: { id: true, displayName: true } },
        _count: { select: { items: true } },
      },
    });
  },
};
