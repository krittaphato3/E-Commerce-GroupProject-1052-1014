import { Router } from "express";
import {
  acceptOrder,
  createOrder,
  getOrder,
  listMyOrders,
  listOrders,
} from "../controllers/orderController.js";
import { orderCreateSchema, validateBody } from "../middleware/validate.js";
import { guardsFor } from "./registry.js";

export const ordersRouter = Router();

ordersRouter.post(
  "/",
  ...guardsFor("POST", "/api/orders"),
  validateBody(orderCreateSchema),
  createOrder
);
ordersRouter.get("/", ...guardsFor("GET", "/api/orders"), listOrders);
ordersRouter.get("/mine", ...guardsFor("GET", "/api/orders/mine"), listMyOrders);
ordersRouter.get("/:id", ...guardsFor("GET", "/api/orders/:id"), getOrder);
ordersRouter.post(
  "/:id/accept",
  ...guardsFor("POST", "/api/orders/:id/accept"),
  acceptOrder
);
