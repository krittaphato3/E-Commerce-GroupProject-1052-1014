import { test, expect } from "@playwright/test";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@campusbites.test";

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

  await page.getByLabel("Pickup note").fill("Pickup at 12:30");
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const orderNumber = (await page.getByTestId("order-number").textContent())?.trim() ?? "";
  expect(orderNumber).toMatch(/^CB-\d{6}$/);
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  await expect(page.getByText("฿150.00")).toBeVisible();
  await expect(page.getByText("Pickup at 12:30")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("order-number")).toHaveText(orderNumber);
  await expect(page.getByText("฿150.00")).toBeVisible();
  await expect(page.getByText("Basil Pork Rice")).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "My orders" }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole("cell", { name: orderNumber })).toBeVisible();
});
