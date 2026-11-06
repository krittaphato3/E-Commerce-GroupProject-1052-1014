import { Router } from "express";
import { createOrder, getOrder, listMyOrders } from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { orderCreateSchema, validateBody } from "../middleware/validate.js";

export const ordersRouter = Router();

ordersRouter.post("/", requireAuth, requireRole("CUSTOMER"), validateBody(orderCreateSchema), createOrder);
ordersRouter.get("/mine", requireAuth, requireRole("CUSTOMER"), listMyOrders);
ordersRouter.get("/:id", requireAuth, getOrder);
