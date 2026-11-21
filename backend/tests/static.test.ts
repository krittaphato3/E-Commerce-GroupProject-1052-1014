import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createApp } from "../src/app.js";

describe("Single-Container Static Serving & SPA Fallback", () => {
  let tempDir: string | null = null;

  afterEach(() => {
    process.env.NODE_ENV = "test";
    delete process.env.SERVE_STATIC;
    delete process.env.CLIENT_DIST_PATH;
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it("serves index.html on root / and deep SPA routes when SERVE_STATIC is enabled", async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cb-static-test-"));
    const indexContent = "<!DOCTYPE html><html><body>Test SPA Root</body></html>";
    fs.writeFileSync(path.join(tempDir, "index.html"), indexContent, "utf-8");

    process.env.SERVE_STATIC = "true";
    process.env.CLIENT_DIST_PATH = tempDir;

    const testApp = createApp();

    // 1. Root route serves index.html
    const rootRes = await request(testApp).get("/");
    expect(rootRes.status).toBe(200);
    expect(rootRes.text).toBe(indexContent);
    expect(rootRes.headers["content-type"]).toContain("text/html");

    // 2. Deep SPA route serves index.html
    const deepRes = await request(testApp).get("/orders/view/123");
    expect(deepRes.status).toBe(200);
    expect(deepRes.text).toBe(indexContent);

    // 3. API route is not hijacked by SPA fallback
    const apiRes = await request(testApp).get("/api/health");
    expect(apiRes.status).toBe(200);
    expect(apiRes.body).toHaveProperty("status", "ok");

    // 4. Non-existent API route falls through to 404, NOT index.html
    const notFoundApiRes = await request(testApp).get("/api/nonexistent-route");
    expect(notFoundApiRes.status).toBe(404);
  });

  it("throws in production if dist directory is missing", () => {
    process.env.NODE_ENV = "production";
    process.env.CLIENT_DIST_PATH = path.join(os.tmpdir(), "nonexistent-dir-for-cb-test");

    expect(() => createApp()).toThrow("Frontend dist directory not found in production environment.");
  });
});
