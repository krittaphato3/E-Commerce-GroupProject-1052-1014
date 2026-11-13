import { test, expect } from "@playwright/test";
import { captureEvidence } from "./evidence";

/**
 * TEST-12: the public menu shows THB prices and sold-out items (AC-12).
 *
 * The sold-out state asserted here comes from the seed itself (Chicken Sandwich
 * has `stockQty: 0`, Pad Thai is delisted), applied by `globalSetup` before any
 * test runs. It is not produced by another spec consuming stock, so this test
 * does not depend on the order in which Playwright runs the spec files.
 */
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

  // Narrow viewport, so the pack also shows the sold-out badge on a phone screen.
  await page.setViewportSize({ width: 430, height: 932 });
  await expect(sandwichCard.getByText("Sold out", { exact: true })).toBeVisible();
  await captureEvidence(page, "F-02-menu-sold-out-mobile.png");
});
