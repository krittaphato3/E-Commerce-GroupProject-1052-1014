/**
 * R-01 route registry (AC-43 / TEST-43).
 *
 * The registry is the single list of Sprint 1 routes. Routers obtain their
 * guards from `guardsFor`, so mounting a protected route that is not registered
 * fails at startup, and `findUnregisteredRoutes` catches a mounted route that
 * skipped the registry. `backend/tests/routes.access.test.ts` drives both.
 */
import type { Express, RequestHandler, Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";

export type HttpMethod = "GET" | "POST" | "PATCH";

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
  { method: "GET", path: "/api/ready" },
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/logout" },
  { method: "GET", path: "/api/menu" },
];

/** Routes that require a session, with the roles each one allows. */
export const protectedRoutes: ReadonlyArray<ProtectedRoute> = [
  { method: "GET", path: "/api/auth/me", roles: [Role.CUSTOMER, Role.OPERATOR] },
  { method: "POST", path: "/api/orders", roles: [Role.CUSTOMER] },
  { method: "GET", path: "/api/orders", roles: [Role.OPERATOR] },
  { method: "GET", path: "/api/orders/mine", roles: [Role.CUSTOMER] },
  { method: "GET", path: "/api/orders/:id", roles: [Role.CUSTOMER, Role.OPERATOR] },
  { method: "POST", path: "/api/orders/:id/accept", roles: [Role.OPERATOR] },
  { method: "POST", path: "/api/orders/:id/reject", roles: [Role.OPERATOR] },
  { method: "POST", path: "/api/orders/:id/cancel", roles: [Role.CUSTOMER] },
  { method: "POST", path: "/api/orders/:id/pay", roles: [Role.CUSTOMER] },
  { method: "POST", path: "/api/orders/:id/start", roles: [Role.OPERATOR] },
  { method: "POST", path: "/api/orders/:id/ready", roles: [Role.OPERATOR] },
  { method: "POST", path: "/api/orders/:id/complete", roles: [Role.OPERATOR] },
  { method: "POST", path: "/api/menu-items", roles: [Role.OPERATOR] },
  { method: "PATCH", path: "/api/menu-items/:id", roles: [Role.OPERATOR] },
];

// Derived from the enum so a newly added schema role automatically widens the
// "all roles" shortcut, while `requireRole(...entry.roles)` still enforces each
// route's explicit list.
const ALL_ROLES: ReadonlyArray<Role> = Object.values(Role);

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
 * Prefixes recorded by `mountRouter`: parent (application or router) -> child
 * router -> every recorded prefix, in mount order. Records are kept per parent
 * because the same router modules are mounted again by every `createApp` call;
 * one application's mounts must never account for a raw mount in another. A
 * WeakMap keeps this bookkeeping off the Express objects.
 */
const routerMountPaths = new WeakMap<object, Map<object, string[]>>();

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
 * Mounts a router on an application or on a parent router and records the prefix
 * so `extractExpressRoutes` can rebuild the full path of every route it serves.
 * Always mount routers with this helper; a raw `app.use` or `router.use` is
 * deliberately reported as unregistered.
 */
export function mountRouter(parent: Express | Router, prefix: string, router: Router): void {
  const children = routerMountPaths.get(parent) ?? new Map<object, string[]>();
  children.set(router, [...(children.get(router) ?? []), prefix]);
  routerMountPaths.set(parent, children);
  // Both share `use(path, router)`; TypeScript cannot call the union of their overloads.
  (parent as Router).use(prefix, router);
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

const UNREGISTERED_MOUNT = "<unregistered-mount>";

/**
 * Appends the routes of one stack, joined onto `base`. `parent` is the
 * application or router that owns the stack, which is the key `mountRouter`
 * recorded its child prefixes under.
 */
function collectRoutes(
  parent: object,
  stack: unknown[],
  base: string,
  routes: ExpressRoute[]
): void {
  // How many times each child router has appeared in this stack so far. The nth
  // appearance takes the nth recorded prefix.
  const appearances = new Map<object, number>();

  for (const rawLayer of stack) {
    const layer = rawLayer as ExpressLayer;

    if (layer.route) {
      for (const method of methodsOf(layer.route)) {
        routes.push({ method, path: joinPaths(base, layer.route.path) });
      }
      continue;
    }

    const handle = layer.handle;
    if (!handle || !Array.isArray(handle.stack)) {
      // Plain middleware (cors, body parser, cookie parser, error handler).
      continue;
    }

    const seen = appearances.get(handle) ?? 0;
    appearances.set(handle, seen + 1);
    const prefix = routerMountPaths.get(parent)?.get(handle)?.[seen];

    if (prefix === undefined) {
      // One marker for the mount itself so an empty unregistered router is
      // still caught; its routes follow for a readable diagnosis.
      routes.push({ method: "GET", path: UNREGISTERED_MOUNT });
      collectRoutes(handle, handle.stack, UNREGISTERED_MOUNT, routes);
      continue;
    }

    collectRoutes(handle, handle.stack, joinPaths(base, prefix), routes);
  }
}

/**
 * Lists every route the Express application actually serves, at any depth.
 *
 * Routes carry `layer.route`. A mounted sub-router carries its own layers on
 * `layer.handle.stack`, which is walked recursively; its prefixes come from
 * `mountRouter`, and each route is reported once per recorded prefix. A router
 * that appears in a stack more often than `mountRouter` recorded it there (a raw
 * `app.use` or `router.use`) is reported under the `<unregistered-mount>`
 * pseudo-prefix, which no registry entry can match.
 */
export function extractExpressRoutes(app: Express): ExpressRoute[] {
  const routes: ExpressRoute[] = [];
  collectRoutes(app, expressStack(app), "", routes);
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
