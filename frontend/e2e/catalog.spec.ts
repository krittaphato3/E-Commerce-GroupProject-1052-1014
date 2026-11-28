import { test, expect } from "@playwright/test";

const operatorEmail = process.env.E2E_OPERATOR_EMAIL ?? "operator1@campusbites.test";

test.beforeAll(() => {
  if (!process.env.SEED_OPERATOR_PASSWORD) {
    throw new Error("SEED_OPERATOR_PASSWORD must be set");
  }
});

/** TEST-57: operator creates, edits price, disables item; public menu reflects each change (AC-57). */
test("TEST-57: operator creates an item, edits its price, and disables it; public menu shows each change", async ({
  page,
}) => {
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD as string;
  const uniqueName = `E2E Special ${Date.now()}`;

  await page.goto("/login");
  await page.getByLabel("Email").fill(operatorEmail);
  await page.getByLabel("Password").fill(operatorPassword);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/operator\/orders$/);

  await page.getByRole("link", { name: "Menu management" }).click();
  await expect(page).toHaveURL(/\/operator\/menu$/);

  // Create item
  await page.getByRole("button", { name: "New item" }).click();
  await page.getByLabel("Name").fill(uniqueName);
  await page.getByLabel("Description").fill("Freshly prepared special");
  await page.getByLabel("Price (THB)").fill("45.50");
  await page.getByLabel("Stock").fill("12");
  await page.getByRole("button", { name: "Save" }).click();

  const row = page.locator("tr", { hasText: uniqueName });
  await expect(row).toBeVisible();
  await expect(row).toContainText("฿45.50");

  // Public menu shows created item
  await page.goto("/menu");
  const card = page.locator("article", { hasText: uniqueName });
  await expect(card).toBeVisible();
  await expect(card).toContainText("฿45.50");

  // Edit price
  await page.goto("/operator/menu");
  await page.locator("tr", { hasText: uniqueName }).getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Price (THB)").fill("52.00");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("tr", { hasText: uniqueName })).toContainText("฿52.00");

  await page.goto("/menu");
  await expect(page.locator("article", { hasText: uniqueName })).toContainText("฿52.00");

  // Disable item
  await page.goto("/operator/menu");
  await page.locator("tr", { hasText: uniqueName }).getByRole("button", { name: "Disable" }).click();
  await expect(page.locator("tr", { hasText: uniqueName })).toContainText("Disabled");

  await page.goto("/menu");
  const disabledCard = page.locator("article", { hasText: uniqueName });
  await expect(disabledCard).toContainText("Sold out");
  await expect(disabledCard.getByRole("button", { name: `Add ${uniqueName} to cart` })).toBeDisabled();
});
