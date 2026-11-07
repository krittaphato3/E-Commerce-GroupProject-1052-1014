/**
 * R-01 route registry (AC-43 / TEST-43).
 *
 * The registry is the single list of Sprint 1 routes. Routers obtain their
 * guards from `guardsFor`, so mounting a protected route that is not registered
 * fails at startup, and `findUnregisteredRoutes` catches a mounted route that
 * skipped the registry. `backend/tests/routes.access.test.ts` drives both.
 */
import type { Express, RequestHandler, Router } from "express";
import type { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";

export type HttpMethod = "GET" | "POST";

export interface PublicRoute {
  method: HttpMethod;
  path: string;
}

export interface ProtectedRoute {
  method: HttpMethod;
  path: string;
  roles: ReadonlyArray<Role>;
}

export interface ExpressRoute {
  method: HttpMethod;
  path: string;
}

/** Routes that any caller may use (DEC-09: the menu is publicly readable). */
export const publicRoutes: ReadonlyArray<PublicRoute> = [
  { method: "GET", path: "/api/health" },
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/logout" },
  { method: "GET", path: "/api/menu" },
];

/** Routes that require a session, with the roles each one allows. */
export const protectedRoutes: ReadonlyArray<ProtectedRoute> = [
  { method: "GET", path: "/api/auth/me", roles: ["CUSTOMER", "OPERATOR"] },
  { method: "POST", path: "/api/orders", roles: ["CUSTOMER"] },
  { method: "GET", path: "/api/orders", roles: ["OPERATOR"] },
  { method: "GET", path: "/api/orders/mine", roles: ["CUSTOMER"] },
  { method: "GET", path: "/api/orders/:id", roles: ["CUSTOMER", "OPERATOR"] },
  { method: "POST", path: "/api/orders/:id/accept", roles: ["OPERATOR"] },
];

const ALL_ROLES: ReadonlyArray<Role> = ["CUSTOMER", "OPERATOR"];

const EXPRESS_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "all",
]);

/**
 * Prefixes recorded by `mountRouter`. A WeakMap keeps this bookkeeping off the
 * Express objects and lets weak references disappear with the routers.
 */
const routerMountPaths = new WeakMap<object, string>();

/**
 * Returns the guard chain for a protected route.
 *
 * Throws when the route is missing from `protectedRoutes`, so an unregistered
 * protected route fails while its module loads instead of silently shipping
 * without authentication.
 */
export function guardsFor(method: HttpMethod, fullPath: string): RequestHandler[] {
  const entry = protectedRoutes.find(
    (route) => route.method === method && route.path === fullPath
  );

  if (!entry) {
    throw new Error(
      `Protected route ${method} ${fullPath} is missing from protectedRoutes registry`
    );
  }

  const everyRoleAllowed = ALL_ROLES.every((role) => entry.roles.includes(role));

  // `requireAuth` alone already admits both roles, so only narrower routes need
  // the role check. This keeps the existing runtime behaviour byte for byte.
  return everyRoleAllowed ? [requireAuth] : [requireAuth, requireRole(...entry.roles)];
}

/**
 * Mounts a router and records its prefix so `extractExpressRoutes` can rebuild
 * the full path of every route it serves. Always mount application routers with
 * this helper; a raw `app.use` is deliberately reported as unregistered.
 *
 * A router mounted at two different prefixes keeps only the last prefix.
 */
export function mountRouter(app: Express, prefix: string, router: Router): void {
  routerMountPaths.set(router, prefix);
  app.use(prefix, router);
}

function expressStack(app: Express): unknown[] {
  const internal = app as unknown as {
    router?: { stack?: unknown[] };
    _router?: { stack?: unknown[] };
  };

  return internal.router?.stack ?? internal._router?.stack ?? [];
}

interface ExpressLayer {
  route?: { path: string; methods: Record<string, boolean> };
  handle?: { stack?: unknown[] } & object;
  name?: string;
}

interface ExpressChildLayer {
  route?: { path: string; methods: Record<string, boolean> };
}

/** Joins a mount prefix and a router-relative path into one canonical path. */
function joinPaths(prefix: string, suffix: string): string {
  const base = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const tail = suffix.startsWith("/") ? suffix : `/${suffix}`;
  const joined = `${base}${tail}`;

  return joined.length > 1 && joined.endsWith("/") ? joined.slice(0, -1) : joined;
}

function methodsOf(route: { methods: Record<string, boolean> }): HttpMethod[] {
  return Object.keys(route.methods)
    .filter((method) => EXPRESS_METHODS.has(method))
    .map((method) => method.toUpperCase() as HttpMethod);
}

/**
 * Lists every route the Express application actually serves.
 *
 * Top-level routes carry `layer.route`. A mounted sub-router carries its route
 * layers on `layer.handle.stack`; its prefix comes from `mountRouter`. A router
 * mounted with a raw `app.use` has no recorded prefix, so it is reported under
 * the `<unregistered-mount>` pseudo-prefix, which no registry entry can match.
 */
export function extractExpressRoutes(app: Express): ExpressRoute[] {
  const routes: ExpressRoute[] = [];

  for (const rawLayer of expressStack(app)) {
    const layer = rawLayer as ExpressLayer;

    if (layer.route) {
      for (const method of methodsOf(layer.route)) {
        routes.push({ method, path: layer.route.path });
      }
      continue;
    }

    const handle = layer.handle;
    if (!handle || !Array.isArray(handle.stack)) {
      // Plain middleware (cors, body parser, cookie parser, error handler).
      continue;
    }

    const prefix = routerMountPaths.get(handle);
    const children = handle.stack as ExpressChildLayer[];

    if (!prefix) {
      // One marker for the mount itself so an empty unregistered router is
      // still caught, then one entry per child route for a readable diagnosis.
      routes.push({ method: "GET", path: "<unregistered-mount>" });
      for (const child of children) {
        if (!child.route) continue;
        for (const method of methodsOf(child.route)) {
          routes.push({ method, path: `<unregistered-mount>${child.route.path}` });
        }
      }
      continue;
    }

    for (const child of children) {
      if (!child.route) continue;
      for (const method of methodsOf(child.route)) {
        routes.push({ method, path: joinPaths(prefix, child.route.path) });
      }
    }
  }

  return routes;
}

/**
 * Returns the mounted routes that appear in neither `publicRoutes` nor
 * `protectedRoutes`, formatted as `"METHOD /path"`. The meta-test asserts this
 * list is empty for the real application.
 */
export function findUnregisteredRoutes(app: Express): string[] {
  const registered = new Set(
    [...publicRoutes, ...protectedRoutes].map((route) => `${route.method} ${route.path}`)
  );

  const unregistered = extractExpressRoutes(app)
    .map((route) => `${route.method} ${route.path}`)
    .filter((key) => !registered.has(key));

  return Array.from(new Set(unregistered));
}
