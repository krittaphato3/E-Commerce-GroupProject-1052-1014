import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import { healthRouter, readyRouter } from "./routes/health.js";
import { menuRouter } from "./routes/menu.js";
import { ordersRouter } from "./routes/orders.js";
import { mountRouter } from "./routes/registry.js";
import { errorHandler } from "./middleware/error.js";
import { env } from "./config/env.js";
import { resolveCorsOptions } from "./config/cors.js";

export function createApp(configureRoutes?: (app: express.Express) => void) {
  const app = express();

  app.use(cors(resolveCorsOptions(env)));
  app.use(express.json());
  app.use(cookieParser());

  // Routes (AC-43: mount through the registry so every route is accounted for)
  mountRouter(app, "/api/health", healthRouter);
  mountRouter(app, "/api/ready", readyRouter);
  mountRouter(app, "/api/auth", authRouter);
  mountRouter(app, "/api/menu", menuRouter);
  mountRouter(app, "/api/orders", ordersRouter);

  // Serve built SPA static files if enabled or in single-container production
  const isProd = process.env.NODE_ENV === "production" || env.NODE_ENV === "production";
  const isProdOrStatic = isProd || process.env.SERVE_STATIC === "true";
  if (isProdOrStatic) {
    const candidates = (
      process.env.CLIENT_DIST_PATH
        ? [process.env.CLIENT_DIST_PATH]
        : [
            path.resolve(process.cwd(), "frontend/dist"),
            path.resolve(process.cwd(), "../frontend/dist"),
          ]
    ).filter((p): p is string => Boolean(p && fs.existsSync(p)));

    const effectiveDistPath = candidates[0];
    if (effectiveDistPath) {
      app.use(express.static(effectiveDistPath));
      app.use((req, res, next) => {
        if ((req.method === "GET" || req.method === "HEAD") && !req.path.startsWith("/api/")) {
          return res.sendFile(path.join(effectiveDistPath, "index.html"));
        }
        next();
      });
    } else {
      console.error("[Omazon Server] Frontend dist directory not found for static serving.");
      if (isProd) {
        throw new Error("Frontend dist directory not found in production environment.");
      }
    }
  }

  if (configureRoutes) {
    configureRoutes(app);
  }

  // Central Error Handler (R-02)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
