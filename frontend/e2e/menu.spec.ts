import { test, expect } from "@playwright/test";

/** TEST-12: the public menu shows THB prices and sold-out items (AC-12). */
test("TEST-12: anonymous menu shows formatted prices and sold-out items", async ({ page }) => {
  await page.goto("/menu");

  const basilCard = page.locator("article").filter({ hasText: "Basil Pork Rice" });
  await expect(basilCard.getByText("฿60.00")).toBeVisible();

  const sandwichCard = page.locator("article").filter({ hasText: "Chicken Sandwich" });
  await expect(sandwichCard.getByText("Sold out", { exact: true })).toBeVisible();
  await expect(
    sandwichCard.getByRole("button", { name: "Add Chicken Sandwich to cart" })
  ).toBeDisabled();

  const padThaiCard = page.locator("article").filter({ hasText: "Pad Thai" });
  await expect(padThaiCard.getByText("Sold out", { exact: true })).toBeVisible();

  await expect(page.getByRole("link", { name: "Log in to order" })).toBeVisible();
});
