import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { menuRouter } from "./routes/menu.js";
import { ordersRouter } from "./routes/orders.js";
import { mountRouter } from "./routes/registry.js";
import { errorHandler } from "./middleware/error.js";
import { env } from "./config/env.js";

export function createApp(configureRoutes?: (app: express.Express) => void) {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Routes (AC-43: mount through the registry so every route is accounted for)
  mountRouter(app, "/api/health", healthRouter);
  mountRouter(app, "/api/auth", authRouter);
  mountRouter(app, "/api/menu", menuRouter);
  mountRouter(app, "/api/orders", ordersRouter);

  if (configureRoutes) {
    configureRoutes(app);
  }

  // Central Error Handler (R-02)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
