import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { testPrisma, clearTestDatabase } from "./helpers/testDb.js";
import { seedDatabase } from "../prisma/seed.js";

describe("F-02 Menu API (AC-10, AC-11, AC-12)", () => {
  beforeEach(async () => {
    await clearTestDatabase(testPrisma);
    await seedDatabase(testPrisma);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("TEST-10: an anonymous GET /api/menu returns every seeded item in id order with the public fields", async () => {
    const response = await request(app).get("/api/menu");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(7);

    const ids = response.body.items.map((item: { id: number }) => item.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));

    for (const item of response.body.items) {
      expect(Object.keys(item).sort()).toEqual(
        ["available", "description", "id", "isAvailable", "name", "priceSatang", "stockQty"].sort()
      );
      expect(Number.isInteger(item.priceSatang)).toBe(true);
      expect(item.priceSatang).toBeGreaterThan(0);
      expect(typeof item.name).toBe("string");
      expect(typeof item.description).toBe("string");
      expect(typeof item.stockQty).toBe("number");
      expect(typeof item.available).toBe("boolean");
    }

    const body = JSON.stringify(response.body);
    expect(body).not.toContain("createdAt");
    expect(body).not.toContain("updatedAt");
    expect(body).not.toContain("passwordHash");
    expect(response.body).not.toHaveProperty("user");
    expect(response.body).not.toHaveProperty("orders");
  });

  it("TEST-10: the menu works with a session cookie and still returns no private data", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer1@campusbites.test",
        password: process.env.SEED_CUSTOMER_PASSWORD,
      });
    expect(login.status).toBe(200);

    const raw = login.headers["set-cookie"];
    const cookies = raw ? (Array.isArray(raw) ? raw : [String(raw)]) : [];
    const cookie = cookies
      .find((value) => value.startsWith("cb_session="))
      ?.split(";")[0] as string;

    const response = await request(app).get("/api/menu").set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(7);
    expect(JSON.stringify(response.body)).not.toContain("customer1@campusbites.test");
  });

  it("TEST-10 (AC-11): available is false exactly when the item is disabled or has no stock", async () => {
    const response = await request(app).get("/api/menu");
    const items = response.body.items as Array<{
      name: string;
      stockQty: number;
      isAvailable: boolean;
      available: boolean;
    }>;

    const basil = items.find((item) => item.name === "Basil Pork Rice");
    expect(basil).toMatchObject({ stockQty: 30, isAvailable: true, available: true });

    const sandwich = items.find((item) => item.name === "Chicken Sandwich");
    expect(sandwich).toMatchObject({ stockQty: 0, isAvailable: true, available: false });

    const padThai = items.find((item) => item.name === "Pad Thai");
    expect(padThai).toMatchObject({ isAvailable: false, available: false });

    for (const item of items) {
      expect(item.available).toBe(item.isAvailable && item.stockQty > 0);
    }
  });
});
