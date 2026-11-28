import { prisma } from "../db/prisma.js";

export interface StoredMenuItem {
  id: number;
  name: string;
  description: string;
  priceSatang: number;
  stockQty: number;
  isAvailable: boolean;
}

export interface CreateMenuItemInput {
  name: string;
  description: string;
  priceSatang: number;
  stockQty: number;
  isAvailable: boolean;
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  priceSatang?: number;
  stockQty?: number;
  isAvailable?: boolean;
}

const MENU_ITEM_SELECT = {
  id: true,
  name: true,
  description: true,
  priceSatang: true,
  stockQty: true,
  isAvailable: true,
} as const;

export const menuRepository = {
  findAll(): Promise<StoredMenuItem[]> {
    return prisma.menuItem.findMany({
      orderBy: { id: "asc" },
      select: MENU_ITEM_SELECT,
    });
  },

  create(data: CreateMenuItemInput): Promise<StoredMenuItem> {
    return prisma.menuItem.create({
      data,
      select: MENU_ITEM_SELECT,
    });
  },

  update(id: number, data: UpdateMenuItemInput): Promise<StoredMenuItem> {
    return prisma.menuItem.update({
      where: { id },
      data,
      select: MENU_ITEM_SELECT,
    });
  },
};
