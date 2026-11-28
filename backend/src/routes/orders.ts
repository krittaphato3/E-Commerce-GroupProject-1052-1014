import { Router } from "express";
import {
  acceptOrder,
  cancelOrder,
  createOrder,
  getOrder,
  listMyOrders,
  listOrders,
  payOrder,
} from "../controllers/orderController.js";
import { orderCreateSchema, orderPaymentSchema, validateBody } from "../middleware/validate.js";
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
ordersRouter.post(
  "/:id/cancel",
  ...guardsFor("POST", "/api/orders/:id/cancel"),
  cancelOrder
);
ordersRouter.post(
  "/:id/pay",
  ...guardsFor("POST", "/api/orders/:id/pay"),
  validateBody(orderPaymentSchema),
  payOrder
);
