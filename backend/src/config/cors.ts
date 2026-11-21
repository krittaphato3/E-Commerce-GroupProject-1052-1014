import type { CorsOptions } from "cors";

const DEV_CLIENT_ORIGIN = "http://localhost:5173";

/**
 * CORS policy. Cross-origin access (with credentials) is only enabled for an
 * explicit CLIENT_ORIGIN, or for the Vite dev origin outside production. In
 * production without CLIENT_ORIGIN the app is same-origin, so CORS is disabled.
 */
export function resolveCorsOptions(config: {
  NODE_ENV: string;
  CLIENT_ORIGIN?: string;
}): CorsOptions {
  const origin = config.CLIENT_ORIGIN || (config.NODE_ENV === "production" ? undefined : DEV_CLIENT_ORIGIN);
  return origin ? { origin, credentials: true } : { origin: false };
}
