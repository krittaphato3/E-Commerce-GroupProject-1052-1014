import { Router } from "express";
import {
  acceptOrder,
  createOrder,
  getOrder,
  listMyOrders,
  listOrders,
} from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { orderCreateSchema, validateBody } from "../middleware/validate.js";

export const ordersRouter = Router();

ordersRouter.post("/", requireAuth, requireRole("CUSTOMER"), validateBody(orderCreateSchema), createOrder);
ordersRouter.get("/", requireAuth, requireRole("OPERATOR"), listOrders);
ordersRouter.get("/mine", requireAuth, requireRole("CUSTOMER"), listMyOrders);
ordersRouter.get("/:id", requireAuth, getOrder);
ordersRouter.post("/:id/accept", requireAuth, requireRole("OPERATOR"), acceptOrder);
