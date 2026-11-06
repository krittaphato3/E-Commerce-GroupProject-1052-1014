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
};
