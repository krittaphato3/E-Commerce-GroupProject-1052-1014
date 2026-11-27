import { Router } from "express";
import { createMenuItem, updateMenuItem } from "../controllers/menuController.js";
import {
  menuItemCreateSchema,
  menuItemUpdateSchema,
  validateBody,
} from "../middleware/validate.js";
import { guardsFor } from "./registry.js";

export const menuItemsRouter = Router();

menuItemsRouter.post(
  "/",
  ...guardsFor("POST", "/api/menu-items"),
  validateBody(menuItemCreateSchema),
  createMenuItem
);

menuItemsRouter.patch(
  "/:id",
  ...guardsFor("PATCH", "/api/menu-items/:id"),
  validateBody(menuItemUpdateSchema),
  updateMenuItem
);
