import { test, expect } from "@playwright/test";
import { captureEvidence } from "./evidence";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@campusbites.test";
const otherCustomerEmail = process.env.E2E_OTHER_CUSTOMER_EMAIL ?? "customer2@campusbites.test";
const apiOrigin =
  process.env.E2E_API_ORIGIN ?? `http://localhost:${process.env.E2E_API_PORT ?? "3100"}`;

test.beforeAll(() => {
  if (!process.env.SEED_CUSTOMER_PASSWORD) {
    throw new Error(
      "SEED_CUSTOMER_PASSWORD must be set (backend/.env is loaded by playwright.config.ts)"
    );
  }
});

/** TEST-29: add items to the cart, place the order, reload and find it in My orders (AC-29). */
test("TEST-29: a customer places an order and sees the saved total", async ({ page }) => {
  const password = process.env.SEED_CUSTOMER_PASSWORD as string;

  await page.goto("/login");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  const basilCard = page.locator("article").filter({ hasText: "Basil Pork Rice" });
  await basilCard
    .getByRole("button", { name: "Increase menu quantity for Basil Pork Rice" })
    .click();
  await basilCard.getByRole("button", { name: "Add Basil Pork Rice to cart" }).click();

  const teaCard = page.locator("article").filter({ hasText: "Thai Iced Tea" });
  await teaCard.getByRole("button", { name: "Add Thai Iced Tea to cart" }).click();

  const cart = page.getByRole("region", { name: "Cart" });
  await expect(cart.getByText("Basil Pork Rice")).toBeVisible();
  await expect(cart.getByText("Thai Iced Tea")).toBeVisible();
  await expect(page.getByText("Estimated total: ฿150.00")).toBeVisible();
  await captureEvidence(page, "F-03-cart-filled.png");

  await page.getByLabel("Pickup note").fill("Pickup at 12:30");
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderNumber = (await page.getByTestId("order-number").textContent())?.trim() ?? "";
  expect(orderNumber).toMatch(/^CB-\d{6}$/);
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  await expect(page.getByText("฿150.00")).toBeVisible();
  await expect(page.getByText("Pickup at 12:30")).toBeVisible();
  await captureEvidence(page, "F-03-order-detail.png");

  await page.reload();
  await expect(page.getByTestId("order-number")).toHaveText(orderNumber);
  await expect(page.getByText("฿150.00")).toBeVisible();
  await expect(page.getByText("Basil Pork Rice")).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "My orders" }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole("cell", { name: orderNumber })).toBeVisible();
  await captureEvidence(page, "F-03-my-orders.png");
});

/**
 * AC-21 (an unavailable item never oversells) and AC-30 (the cart survives the
 * failure, nothing is ordered) against the real backend, with no mocking.
 *
 * `Mango Sticky Rice` is seeded with stockQty 1. This is the only journey that
 * spends it: `TEST-12`, `TEST-29` and `TEST-41` never order it, and this test
 * runs last (order.spec.ts sorts after menu.spec.ts, operator.spec.ts and
 * auth.spec.ts) so `TEST-12` never sees a depleted catalog. `globalSetup`
 * re-seeds the database on the next run, so the depletion never accumulates.
 */
test("AC-21 / AC-30: a stale cart gets 409 ITEM_UNAVAILABLE and keeps both lines", async ({
  page,
  request,
}) => {
  const password = process.env.SEED_CUSTOMER_PASSWORD as string;

  // customer1 fills a cart while Mango Sticky Rice still shows one unit left.
  await page.goto("/login");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  const mangoCard = page.locator("article").filter({ hasText: "Mango Sticky Rice" });
  await mangoCard.getByRole("button", { name: "Add Mango Sticky Rice to cart" }).click();

  const teaCard = page.locator("article").filter({ hasText: "Thai Iced Tea" });
  await teaCard.getByRole("button", { name: "Add Thai Iced Tea to cart" }).click();

  const cart = page.getByRole("region", { name: "Cart" });
  await expect(cart.getByText("Mango Sticky Rice")).toBeVisible();
  await expect(cart.getByText("Thai Iced Tea")).toBeVisible();

  // customer2 buys the last unit through the API, so customer1's cart is stale.
  const menuResponse = await request.get(`${apiOrigin}/api/menu`);
  expect(menuResponse.status()).toBe(200);
  const menu = (await menuResponse.json()) as { items: Array<{ id: number; name: string }> };
  const mango = menu.items.find((item) => item.name === "Mango Sticky Rice");
  expect(mango, "the seed must provide Mango Sticky Rice").toBeDefined();

  const loginResponse = await request.post(`${apiOrigin}/api/auth/login`, {
    data: { email: otherCustomerEmail, password },
  });
  expect(loginResponse.status()).toBe(200);

  const raceOrder = await request.post(`${apiOrigin}/api/orders`, {
    data: { items: [{ menuItemId: mango!.id, quantity: 1 }] },
  });
  expect(raceOrder.status()).toBe(201);

  // The stale cart now races the backend and must fail without losing the cart.
  await page.getByRole("button", { name: "Place order" }).click();

  const alert = page.getByRole("alert");
  await expect(page).toHaveURL(/\/menu$/);
  await expect(alert).toContainText("Mango Sticky Rice");
  await expect(alert).toContainText("sold out");
  // The alert lives inside the Cart region, so match the line itself exactly.
  await expect(cart.getByText("Mango Sticky Rice", { exact: true })).toBeVisible();
  await expect(cart.getByText("Thai Iced Tea", { exact: true })).toBeVisible();
  await captureEvidence(page, "F-03-order-unavailable-409.png");
});
