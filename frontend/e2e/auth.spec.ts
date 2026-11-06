import { test, expect } from "@playwright/test";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL ?? "customer1@campusbites.test";
const operatorEmail = process.env.E2E_OPERATOR_EMAIL ?? "operator1@campusbites.test";

test.beforeAll(() => {
  if (!process.env.SEED_CUSTOMER_PASSWORD || !process.env.SEED_OPERATOR_PASSWORD) {
    throw new Error(
      "SEED_CUSTOMER_PASSWORD and SEED_OPERATOR_PASSWORD must be set (backend/.env is loaded by playwright.config.ts)"
    );
  }
});

/** TEST-09: login, logout, invalid login and role-based redirects (AC-09). */
test("TEST-09: customer and operator login, logout and invalid credentials", async ({ page }) => {
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD as string;
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD as string;

  await page.goto("/login");
  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(customerPassword);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByText("Alice Customer")).toBeVisible();
  await expect(page.getByText("CUSTOMER", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(customerEmail);
  await page.getByLabel("Password").fill(`${customerPassword}-wrong`);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid email or password.");

  await page.getByLabel("Email").fill(operatorEmail);
  await page.getByLabel("Password").fill(operatorPassword);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/operator\/orders$/);
  await expect(page.getByText("Staff Operator 1")).toBeVisible();
  await expect(page.getByText("OPERATOR", { exact: true })).toBeVisible();
});
