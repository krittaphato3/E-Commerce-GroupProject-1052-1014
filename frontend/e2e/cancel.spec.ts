import { expect, test, type Page } from "@playwright/test";
import { captureEvidence } from "./evidence";
import globalSetup from "./globalSetup";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@campusbites.test";

/** Seeded with one unit, so the menu card itself shows the stock ("1 left" / "Sold out"). */
const ITEM_NAME = "Mango Sticky Rice";

test.beforeAll(() => {
  if (!process.env.SEED_CUSTOMER_PASSWORD) {
    throw new Error("SEED_CUSTOMER_PASSWORD must be set (backend/.env is loaded by playwright.config.ts)");
  }
});

/**
 * The journeys share one database, and TEST-41 counts the rows in the operator
 * list. Re-seed so the order cancelled here is not left for later spec files.
 */
test.afterAll(() => {
  globalSetup();
});

async function menuStock(page: Page): Promise<number> {
  const response = await page.request.get("/api/menu");
  expect(response.status()).toBe(200);
  const menu = (await response.json()) as { items: Array<{ name: string; stockQty: number }> };
  const item = menu.items.find((entry) => entry.name === ITEM_NAME);
  expect(item, `${ITEM_NAME} must be seeded`).toBeDefined();
  return item!.stockQty;
}

/** TEST-67: place an order, cancel it, reload, and compare the menu stock (AC-67). */
test("TEST-67: a customer cancels a pending order and the menu stock comes back", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(process.env.SEED_CUSTOMER_PASSWORD as string);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  const card = page.locator("article").filter({ hasText: ITEM_NAME });
  const stockBefore = await menuStock(page);
  await expect(card.getByText(`${stockBefore} left`)).toBeVisible();
  await captureEvidence(page, "F-06-stock-before.png");

  await card.getByRole("button", { name: `Add ${ITEM_NAME} to cart` }).click();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderUrl = page.url();
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  expect(await menuStock(page)).toBe(stockBefore - 1);

  // The reservation is visible on the menu, so "before" and "after" are not trivially equal.
  await page.goto("/menu");
  await expect(card.getByText("Sold out")).toBeVisible();
  await captureEvidence(page, "F-06-stock-reserved.png");
  await page.goto(orderUrl);

  await page.getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByText("Cancel this order?")).toBeVisible();
  await captureEvidence(page, "F-06-cancel-confirm.png");
  await page.getByRole("button", { name: "Yes, cancel" }).click();

  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(orderUrl);
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Pending → Cancelled" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel order" })).toHaveCount(0);
  await captureEvidence(page, "F-06-order-cancelled.png");

  await page.goto("/menu");
  await expect(card.getByText(`${stockBefore} left`)).toBeVisible();
  expect(await menuStock(page)).toBe(stockBefore);
  await captureEvidence(page, "F-06-stock-after.png");
});
