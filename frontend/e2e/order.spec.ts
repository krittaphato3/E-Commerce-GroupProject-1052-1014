import { expect, request as playwrightRequest, test } from "@playwright/test";
import { captureEvidence } from "./evidence";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@campusbites.test";
const otherCustomerEmail = process.env.E2E_OTHER_CUSTOMER_EMAIL ?? "customer2@campusbites.test";
const apiOrigin =
  process.env.E2E_API_ORIGIN ?? `http://localhost:${process.env.E2E_API_PORT ?? "3100"}`;

interface MenuItemSummary {
  id: number;
  name: string;
  stockQty: number;
  available: boolean;
}

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
 * The journey prepares the sold-out state itself: it picks an orderable item
 * (smallest stock first, so the buy-out needs few calls) plus a second item that
 * stays available, then has `customer2` buy every remaining unit through the
 * API. It therefore does not depend on which spec file Playwright runs before
 * it, or on alphabetical file order; `globalSetup` re-seeds the database at the
 * start of every run, so the depletion never accumulates.
 */
test("AC-21 / AC-30: a stale cart gets 409 ITEM_UNAVAILABLE and keeps both lines", async ({
  page,
  request,
}) => {
  const password = process.env.SEED_CUSTOMER_PASSWORD as string;

  const menuResponse = await request.get(`${apiOrigin}/api/menu`);
  expect(menuResponse.status()).toBe(200);
  const menu = (await menuResponse.json()) as { items: MenuItemSummary[] };
  const orderable = menu.items
    .filter((item) => item.available && item.stockQty > 0)
    .sort((left, right) => left.stockQty - right.stockQty);

  const lastUnit = orderable[0];
  const keeper = orderable.find((item) => item.id !== lastUnit?.id);
  expect(lastUnit, "the seed must provide an orderable item").toBeDefined();
  expect(keeper, "the seed must provide a second orderable item").toBeDefined();

  // customer1 fills a cart while `lastUnit` still shows at least one unit left.
  await page.goto("/login");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  const lastUnitCard = page.locator("article").filter({ hasText: lastUnit!.name });
  await lastUnitCard.getByRole("button", { name: `Add ${lastUnit!.name} to cart` }).click();

  const keeperCard = page.locator("article").filter({ hasText: keeper!.name });
  await keeperCard.getByRole("button", { name: `Add ${keeper!.name} to cart` }).click();

  const cart = page.getByRole("region", { name: "Cart" });
  await expect(cart.getByText(lastUnit!.name, { exact: true })).toBeVisible();
  await expect(cart.getByText(keeper!.name, { exact: true })).toBeVisible();

  // customer2 buys every remaining unit through the API, so customer1's cart is
  // stale. A dedicated request context keeps customer1's browser session intact.
  const otherApi = await playwrightRequest.newContext();
  try {
    const loginResponse = await otherApi.post(`${apiOrigin}/api/auth/login`, {
      data: { email: otherCustomerEmail, password },
    });
    expect(loginResponse.status()).toBe(200);

    // BR-01 caps one line at 10 units, so buy out in chunks.
    let remaining = lastUnit!.stockQty;
    while (remaining > 0) {
      const quantity = Math.min(10, remaining);
      const response = await otherApi.post(`${apiOrigin}/api/orders`, {
        data: { items: [{ menuItemId: lastUnit!.id, quantity }] },
      });
      expect(response.status()).toBe(201);
      remaining -= quantity;
    }
  } finally {
    await otherApi.dispose();
  }

  // Confirm the prepared state before exercising the race.
  const afterBuyout = await request.get(`${apiOrigin}/api/menu`);
  const depleted = ((await afterBuyout.json()) as { items: MenuItemSummary[] }).items.find(
    (item) => item.id === lastUnit!.id
  );
  expect(depleted?.available, `${lastUnit!.name} must be sold out`).toBe(false);

  // The stale cart now races the backend and must fail without losing the cart.
  await page.getByRole("button", { name: "Place order" }).click();

  const alert = page.getByRole("alert");
  await expect(page).toHaveURL(/\/menu$/);
  await expect(alert).toContainText(lastUnit!.name);
  await expect(alert).toContainText("sold out");
  // The alert lives inside the Cart region, so match the line itself exactly.
  await expect(cart.getByText(lastUnit!.name, { exact: true })).toBeVisible();
  await expect(cart.getByText(keeper!.name, { exact: true })).toBeVisible();
  await captureEvidence(page, "F-03-order-unavailable-409.png");
});
