import type { Request, Response } from "express";
import { menuService } from "../services/menuService.js";

/** GET /api/menu — public (FR-04, AC-10). */
export async function listMenu(_req: Request, res: Response): Promise<void> {
  const items = await menuService.list();
  res.status(200).json({ items });
}
