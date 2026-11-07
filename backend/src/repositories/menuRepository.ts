import { prisma } from "../db/prisma.js";

export interface StoredMenuItem {
  id: number;
  name: string;
  description: string;
  priceSatang: number;
  stockQty: number;
  isAvailable: boolean;
}

export const menuRepository = {
  findAll(): Promise<StoredMenuItem[]> {
    return prisma.menuItem.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        priceSatang: true,
        stockQty: true,
        isAvailable: true,
      },
    });
  },
};
