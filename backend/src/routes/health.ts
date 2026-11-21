import { Router, Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    version: "1.0.0",
  });
});

/** Readiness probe: 200 when the database answers, 503 when it does not. */
export const readyRouter = Router();

readyRouter.get("/", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", database: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable", database: "unreachable" });
  }
});
