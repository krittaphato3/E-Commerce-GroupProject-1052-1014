import { isOrderable } from "./menuRules.js";
import { menuRepository, type StoredMenuItem } from "../repositories/menuRepository.js";

export interface MenuViewItem extends StoredMenuItem {
  available: boolean;
}

export const menuService = {
  /** FR-04/AC-10: the public catalog, with availability computed by the shared rule. */
  async list(): Promise<MenuViewItem[]> {
    const items = await menuRepository.findAll();

    return items.map((item) => ({
      ...item,
      available: isOrderable(item, 1),
    }));
  },
};
