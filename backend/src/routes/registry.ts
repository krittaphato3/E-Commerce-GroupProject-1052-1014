/**
 * R-01 route registry (AC-43 / TEST-43).
 *
 * Stub scaffold: the shapes and the exported surface are final so the test
 * suite compiles and fails on its assertions; the data and behaviour arrive in
 * the green commit.
 */
import type { Express, RequestHandler, Router } from "express";
import type { Role } from "@prisma/client";

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

export const publicRoutes: ReadonlyArray<PublicRoute> = [];

export const protectedRoutes: ReadonlyArray<ProtectedRoute> = [];

/** Returns the guards for a protected route, or throws when it is unregistered. */
export function guardsFor(_method: HttpMethod, _fullPath: string): RequestHandler[] {
  return [];
}

/** Mounts a router and records its prefix for route extraction. */
export function mountRouter(_app: Express, _prefix: string, _router: Router): void {
  // Stub: nothing is mounted yet.
}

/** Lists every route the Express application actually serves. */
export function extractExpressRoutes(_app: Express): ExpressRoute[] {
  return [];
}

/** Returns the mounted routes that are in neither registry list. */
export function findUnregisteredRoutes(_app: Express): string[] {
  return [];
}
