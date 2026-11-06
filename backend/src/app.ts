import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/error.js";

export function createApp(configureRoutes?: (app: express.Express) => void) {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  app.use("/api/health", healthRouter);

  if (configureRoutes) {
    configureRoutes(app);
  }

  // Central Error Handler (R-02)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
