import { describe, it, expect } from "vitest";
import express, { Router, type RequestHandler } from "express";
import request from "supertest";
import {
  extractExpressRoutes,
  findUnregisteredRoutes,
  mountRouter,
  type ExpressRoute,
} from "../src/routes/registry.js";

const ok: RequestHandler = (_req, res) => {
  res.json({ ok: true });
};

function mountedPaths(app: express.Express): string[] {
  return extractExpressRoutes(app)
    .map((route: ExpressRoute) => `${route.method} ${route.path}`)
    .sort();
}

describe("R-05 route registry extraction (AC-90, AC-91)", () => {
  it("TEST-90: reports nested routes with full paths and flags unregistered and raw nested mounts", async () => {
    // Two levels deep: app -> /api -> /orders -> /:orderId/lines
    const lines = Router();
    lines.get("/:lineId", ok);
    const orders = Router();
    orders.get("/", ok);
    mountRouter(orders, "/:orderId/lines", lines);
    const api = Router();
    api.get("/health", ok);
    mountRouter(api, "/orders", orders);
    const app = express();
    mountRouter(app, "/api", api);

    // The app really serves the deepest route, so extraction must not miss it.
    expect((await request(app).get("/api/orders/1/lines/2")).status).toBe(200);
    expect(mountedPaths(app)).toEqual([
      "GET /api/health",
      "GET /api/orders",
      "GET /api/orders/:orderId/lines/:lineId",
    ]);

    // An unregistered nested route is returned with its full path.
    const hidden = Router();
    hidden.post("/secret", ok);
    const parent = Router();
    mountRouter(parent, "/nested", hidden);
    const appWithHidden = express();
    mountRouter(appWithHidden, "/api", parent);
    expect(findUnregisteredRoutes(appWithHidden)).toEqual(["POST /api/nested/secret"]);

    // A nested router mounted with a raw router.use is reported as unregistered,
    // even when its path would otherwise look like a registered route.
    const menu = Router();
    menu.get("/menu", ok);
    const rawParent = Router();
    rawParent.use("/", menu);
    const appWithRawNested = express();
    mountRouter(appWithRawNested, "/api", rawParent);
    expect((await request(appWithRawNested).get("/api/menu")).status).toBe(200);
    expect(findUnregisteredRoutes(appWithRawNested)).toEqual([
      "GET <unregistered-mount>",
      "GET <unregistered-mount>/menu",
    ]);
  });

  it("TEST-91: reports every recorded prefix once and flags an extra raw mount", () => {
    const shared = Router();
    shared.get("/thing", ok);

    const twice = express();
    mountRouter(twice, "/api/a", shared);
    mountRouter(twice, "/api/b", shared);
    expect(mountedPaths(twice)).toEqual(["GET /api/a/thing", "GET /api/b/thing"]);

    // The same router in a second app: one recorded mount plus one raw mount.
    const mixed = express();
    mountRouter(mixed, "/api/a", shared);
    mixed.use("/api/b", shared);
    expect(mountedPaths(mixed)).toEqual([
      "GET /api/a/thing",
      "GET <unregistered-mount>",
      "GET <unregistered-mount>/thing",
    ]);
    expect(findUnregisteredRoutes(mixed)).toContain("GET <unregistered-mount>");

    // The second app's mounts do not change what the first app reports.
    expect(mountedPaths(twice)).toEqual(["GET /api/a/thing", "GET /api/b/thing"]);
  });
});
