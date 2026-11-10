import { test, expect } from "@playwright/test";
import { captureEvidence, captureEvidenceLocator } from "./evidence";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@campusbites.test";
const operatorEmail = process.env.E2E_OPERATOR_EMAIL ?? "operator1@campusbites.test";

test.beforeAll(() => {
  if (!process.env.SEED_CUSTOMER_PASSWORD || !process.env.SEED_OPERATOR_PASSWORD) {
    throw new Error(
      "SEED_CUSTOMER_PASSWORD and SEED_OPERATOR_PASSWORD must be set (backend/.env is loaded by playwright.config.ts)"
    );
  }
});

/** TEST-41: operator accepts order, customer sees Accepted and history (AC-41). */
test("TEST-41: an operator accepts a pending order and the customer sees Accepted and history", async ({
  page,
}) => {
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD as string;
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD as string;

  // 1. Customer places an order
  await page.goto("/login");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(customerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  const card = page.locator("article").filter({ hasText: "Basil Pork Rice" });
  await card.getByRole("button", { name: "Add Basil Pork Rice to cart" }).click();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderNumber = (await page.getByTestId("order-number").textContent())?.trim() ?? "";
  expect(orderNumber).toMatch(/^CB-\d{6}$/);

  // A second pending order gives the dashboard more than one row, so the
  // evidence capture shows the list (and its timestamps) rather than a single
  // order. Ordering itself is asserted by TEST-32; the short pause only makes
  // the two placed times distinguishable in the screenshot.
  const menuResponse = await page.request.get("/api/menu");
  expect(menuResponse.status()).toBe(200);
  const menu = (await menuResponse.json()) as {
    items: Array<{ id: number; name: string; available: boolean }>;
  };
  const secondItem = menu.items.find((item) => item.available && item.name !== "Basil Pork Rice");
  expect(secondItem, "the seed must provide a second orderable item").toBeDefined();
  await page.waitForTimeout(1_000);
  const secondOrder = await page.request.post("/api/orders", {
    data: { items: [{ menuItemId: secondItem!.id, quantity: 1 }] },
  });
  expect(secondOrder.status()).toBe(201);

  // Customer logs out
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // 2. Operator logs in and accepts the order
  await page.getByLabel("Email").fill(operatorEmail);
  await page.getByLabel("Password").fill(operatorPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/operator\/orders$/);

  const orderRow = page.locator("tr").filter({ hasText: orderNumber });
  await expect(orderRow).toBeVisible();
  await expect(orderRow.getByText("Pending", { exact: true })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await captureEvidence(page, "F-01-operator-orders.png");

  // The acceptance action itself: the PENDING row with its Accept button.
  const acceptButton = orderRow.getByRole("button", { name: "Accept" });
  await expect(acceptButton).toBeVisible();
  await captureEvidenceLocator(orderRow, "F-04-operator-accept-action.png");

  await acceptButton.click();

  await expect(orderRow.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(orderRow.getByRole("button", { name: "Accept" })).toHaveCount(0);

  // Show the result on the unfiltered list, so the accepted order and the
  // remaining pending order are both visible (no ACCEPTED row under Pending).
  const allButton = page.getByRole("button", { name: "All", exact: true });
  const listReloaded = page.waitForResponse(
    (response) => response.url().includes("/api/orders") && response.request().method() === "GET"
  );
  await allButton.click();
  await listReloaded;
  await expect(allButton).toHaveClass(/btn-primary/);
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(orderRow.getByText("Accepted", { exact: true })).toBeVisible();
  await captureEvidence(page, "F-04-operator-accepted.png");

  // Operator logs out
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // 3. Customer logs in and verifies Accepted status and history
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(customerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  await page.getByRole("link", { name: "My orders" }).click();
  await expect(page).toHaveURL(/\/orders$/);

  const customerOrderRow = page.locator("tr").filter({ hasText: orderNumber });
  await expect(customerOrderRow.getByText("Accepted", { exact: true })).toBeVisible();

  await customerOrderRow.getByRole("link", { name: orderNumber }).click();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(page.getByText("Pending → Accepted")).toBeVisible();
  await captureEvidence(page, "F-04-customer-accepted.png");
});

/** TEST-42: customer opening /operator/orders sees in-place 403 Forbidden without operator table (AC-42). */
test("TEST-42: a customer navigating to /operator/orders sees in-place 403 Forbidden", async ({
  page,
}) => {
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD as string;

  await page.goto("/login");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(customerPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  await page.goto("/operator/orders");

  // In-place 403 alert is displayed per DEC-17 / d7ec1c2
  await expect(page.getByRole("alert")).toContainText("403 Forbidden: You have no access to this page.");
  await expect(page.getByRole("table")).toHaveCount(0);
  await captureEvidence(page, "F-04-customer-forbidden-403.png");
});
