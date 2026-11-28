import type { Request, Response } from "express";
import { AppError } from "../middleware/error.js";
import {
  parsePositiveIntegerParam,
  type MenuItemCreateBody,
  type MenuItemUpdateBody,
} from "../middleware/validate.js";
import { menuService } from "../services/menuService.js";

/** GET /api/menu — public (FR-04, AC-10). */
export async function listMenu(_req: Request, res: Response): Promise<void> {
  const items = await menuService.list();
  res.status(200).json({ items });
}

/** POST /api/menu-items — Operator (FR-10, AC-47). */
export async function createMenuItem(req: Request, res: Response): Promise<void> {
  const item = await menuService.create(req.body as MenuItemCreateBody);
  res.status(201).json({ item });
}

/** PATCH /api/menu-items/:id — Operator (FR-10, AC-48, AC-54). */
export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  const rawId = typeof req.params.id === "string" ? req.params.id : undefined;
  const id = parsePositiveIntegerParam(rawId);
  if (id === null) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid menu item id");
  }

  const item = await menuService.update(id, req.body as MenuItemUpdateBody);
  res.status(200).json({ item });
}
