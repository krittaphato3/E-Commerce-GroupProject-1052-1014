import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.js";
import type { MenuItemCreateBody, MenuItemUpdateBody } from "../middleware/validate.js";
import { isOrderable } from "./menuRules.js";
import { menuRepository, type StoredMenuItem } from "../repositories/menuRepository.js";

export interface MenuViewItem extends StoredMenuItem {
  available: boolean;
}

function toMenuViewItem(item: StoredMenuItem): MenuViewItem {
  return {
    ...item,
    available: isOrderable(item, 1),
  };
}

function mapMenuPrismaError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid request body", [
        { field: "name", message: "A menu item with this name already exists" },
      ]);
    }
    if (err.code === "P2025") {
      throw new AppError(404, "NOT_FOUND", "Menu item not found");
    }
  }
  throw err;
}

export const menuService = {
  /** FR-04/AC-10: the public catalog, with availability computed by the shared rule. */
  async list(): Promise<MenuViewItem[]> {
    const items = await menuRepository.findAll();
    return items.map(toMenuViewItem);
  },

  /** FR-10/AC-47: creates a new menu item (Operator only). */
  async create(input: MenuItemCreateBody): Promise<MenuViewItem> {
    try {
      const created = await menuRepository.create(input);
      return toMenuViewItem(created);
    } catch (err) {
      mapMenuPrismaError(err);
    }
  },

  /** FR-10/AC-48: updates an existing menu item (Operator only). */
  async update(id: number, input: MenuItemUpdateBody): Promise<MenuViewItem> {
    try {
      const updated = await menuRepository.update(id, input);
      return toMenuViewItem(updated);
    } catch (err) {
      mapMenuPrismaError(err);
    }
  },
};
