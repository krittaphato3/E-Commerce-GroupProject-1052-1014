import { expect, test, type Page } from "@playwright/test";
import { captureEvidence } from "./evidence";
import globalSetup from "./globalSetup";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@campusbites.test";
const operatorEmail = process.env.E2E_OPERATOR_EMAIL ?? "operator1@campusbites.test";

const ITEM_NAME = "Basil Pork Rice";

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

/** TEST-76: create and accept an order in the test, pay it, reload (AC-76). */
test("TEST-76: a customer pays an accepted order and still sees Paid after a reload", async ({
  page,
  browser,
}) => {
  await logIn(page, customerEmail, process.env.SEED_CUSTOMER_PASSWORD as string);

  const card = page.locator("article").filter({ hasText: ITEM_NAME });
  await card.getByRole("button", { name: `Add ${ITEM_NAME} to cart` }).click();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderUrl = page.url();
  const orderId = Number(orderUrl.split("/").pop());
  await expect(page.getByText("You can pay after the shop accepts this order.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay", exact: true })).toHaveCount(0);

  // The operator accepts in a separate session.
  const operatorContext = await browser.newContext();
  const operatorPage = await operatorContext.newPage();
  await logIn(operatorPage, operatorEmail, process.env.SEED_OPERATOR_PASSWORD as string);
  const accepted = await operatorPage.request.post(`/api/orders/${orderId}/accept`);
  expect(accepted.status()).toBe(200);
  const totalSatang = (await accepted.json()).order.totalSatang as number;
  await operatorContext.close();

  await page.reload();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(page.getByText("Unpaid", { exact: true })).toBeVisible();

  // A second tab keeps the unpaid page open, so it can try to pay again afterwards.
  const staleTab = await page.context().newPage();
  await staleTab.goto(orderUrl);
  await staleTab.getByRole("button", { name: "Pay", exact: true }).click();

  await page.getByRole("button", { name: "Pay", exact: true }).click();
  await expect(page.getByText(`Pay ฿${(totalSatang / 100).toFixed(2)} (simulated)?`)).toBeVisible();
  await captureEvidence(page, "F-07-pay-confirm.png");
  await page.getByRole("button", { name: "Confirm payment" }).click();

  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay", exact: true })).toHaveCount(0);

  await page.reload();
  await expect(page).toHaveURL(orderUrl);
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay", exact: true })).toHaveCount(0);
  await captureEvidence(page, "F-07-order-paid.png");

  // The stale tab is rejected with the API message and reloads to the paid order.
  await staleTab.getByRole("button", { name: "Confirm payment" }).click();
  await expect(staleTab.getByRole("alert")).toContainText("Cannot pay");
  await expect(staleTab.getByText("Paid", { exact: true })).toBeVisible();
  await expect(staleTab.getByRole("button", { name: "Pay", exact: true })).toHaveCount(0);
  await captureEvidence(staleTab, "F-07-pay-rejected.png");
  await staleTab.close();
});
