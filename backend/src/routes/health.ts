import { Router, Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export const healthRouter = Router();

export function resolveAppVersion(): string {
  const candidate = process.env.APP_VERSION?.trim() || process.env.GIT_SHA?.trim();
  return candidate || "1.0.0";
}

healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    version: resolveAppVersion(),
  });
});

const READY_TIMEOUT_MS = 2000;

/** Strips anything URL-shaped so a connection string can never reach the logs. */
function safeErrorSummary(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  const message = error instanceof Error ? error.message : String(error);
  const redacted = message.replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, "[redacted]").slice(0, 200);
  return typeof code === "string" ? `${code}: ${redacted}` : redacted;
}

/** Resolves true when `SELECT 1` answers within the timeout, false otherwise. */
export async function checkDatabaseReady(timeoutMs: number = READY_TIMEOUT_MS): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`database check timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
    return true;
  } catch (error) {
    console.error(`[Omazon Server] Readiness check failed: ${safeErrorSummary(error)}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Readiness probe: 200 when the database answers in time, 503 otherwise. Never cached. */
export const readyRouter = Router();

readyRouter.get("/", async (_req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  if (await checkDatabaseReady()) {
    res.status(200).json({ status: "ready", database: "ok" });
  } else {
    res.status(503).json({ status: "unavailable", database: "unreachable" });
  }
});
