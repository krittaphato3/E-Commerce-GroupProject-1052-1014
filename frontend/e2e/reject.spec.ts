import { expect, test, type Page } from "@playwright/test";
import { captureEvidence, captureEvidenceLocator } from "./evidence";
import globalSetup from "./globalSetup";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@campusbites.test";
const operatorEmail = process.env.E2E_OPERATOR_EMAIL ?? "operator1@campusbites.test";

/** Seeded with one unit, so the menu card itself shows the stock ("1 left" / "Sold out"). */
const ITEM_NAME = "Mango Sticky Rice";
const REASON = "The mangoes were not delivered today";

test.beforeAll(() => {
  if (!process.env.SEED_CUSTOMER_PASSWORD || !process.env.SEED_OPERATOR_PASSWORD) {
    throw new Error(
      "SEED_CUSTOMER_PASSWORD and SEED_OPERATOR_PASSWORD must be set (backend/.env is loaded by playwright.config.ts)"
    );
  }
});

/** The journeys share one database; re-seed so this order is not left for later spec files. */
test.afterAll(() => {
  globalSetup();
});

async function logIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function logOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function menuStock(page: Page): Promise<number> {
  const response = await page.request.get("/api/menu");
  expect(response.status()).toBe(200);
  const menu = (await response.json()) as { items: Array<{ name: string; stockQty: number }> };
  const item = menu.items.find((entry) => entry.name === ITEM_NAME);
  expect(item, `${ITEM_NAME} must be seeded`).toBeDefined();
  return item!.stockQty;
}

/** TEST-104: order, reject with a reason, and the customer sees it (AC-104). */
test("TEST-104: an operator rejects an order with a reason, the customer sees it and the stock comes back", async ({
  page,
}) => {
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD as string;
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD as string;

  // 1. Customer places an order.
  await logIn(page, customerEmail, customerPassword);
  const stockBefore = await menuStock(page);
  const card = page.locator("article").filter({ hasText: ITEM_NAME });
  await card.getByRole("button", { name: `Add ${ITEM_NAME} to cart` }).click();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderUrl = page.url();
  const orderNumber = (await page.getByTestId("order-number").textContent())?.trim() ?? "";
  expect(orderNumber).toMatch(/^CB-\d{6}$/);
  expect(await menuStock(page)).toBe(stockBefore - 1);
  await logOut(page);

  // 2. Operator rejects it; a short reason is refused first.
  await logIn(page, operatorEmail, operatorPassword);
  const row = page.locator("tbody tr").filter({ hasText: orderNumber });
  await row.getByRole("button", { name: "Reject", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `Reject order ${orderNumber}` });
  await dialog.getByRole("textbox", { name: "Reason" }).fill("no");
  await dialog.getByRole("button", { name: "Reject order" }).click();
  await expect(dialog.getByText("Reason must be 5 to 200 characters.")).toBeVisible();
  await expect(dialog.getByText("2/200")).toBeVisible();
  await captureEvidence(page, "F-09-reject-dialog-validation.png");

  await dialog.getByRole("textbox", { name: "Reason" }).fill(REASON);
  await dialog.getByRole("button", { name: "Reject order" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Rejected", exact: true }).click();
  await expect(row.getByText("Rejected", { exact: true })).toBeVisible();
  await expect(row.getByRole("button")).toHaveCount(0);
  await captureEvidence(page, "F-09-operator-rejected.png");
  await captureEvidenceLocator(row, "F-09-operator-rejected-row.png");
  await logOut(page);

  // 3. Customer sees the status, the reason and the history entry.
  await logIn(page, customerEmail, customerPassword);
  await page.goto(orderUrl);
  await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
  await expect(page.getByText("Reason for rejection:")).toBeVisible();
  await expect(page.getByText(REASON)).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Pending → Rejected" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel order" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pay", exact: true })).toHaveCount(0);
  await captureEvidence(page, "F-09-customer-reason.png");

  expect(await menuStock(page)).toBe(stockBefore);
});
