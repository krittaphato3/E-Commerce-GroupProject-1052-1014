import { expect, test, type Browser, type Page } from "@playwright/test";
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

/** The journeys share one database; re-seed so these orders are not left for later spec files. */
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

async function signedInPage(browser: Browser, email: string, password: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await logIn(page, email, password);
  return page;
}

async function post(page: Page, path: string, data?: object): Promise<void> {
  const response = await page.request.post(path, { data });
  expect(response.ok(), `POST ${path} -> ${response.status()}`).toBe(true);
}

/**
 * TEST-87: the operator takes a paid order to Completed with the three buttons,
 * then the customer sees Completed and the full timeline (AC-87).
 */
test("TEST-87: an operator fulfils a paid order and the customer sees it Completed", async ({
  page,
  browser,
}) => {
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD as string;
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD as string;
  const customerApi = await signedInPage(browser, customerEmail, customerPassword);
  const operatorApi = await signedInPage(browser, operatorEmail, operatorPassword);

  const menu = (await (await customerApi.request.get("/api/menu")).json()) as {
    items: Array<{ id: number; name: string }>;
  };
  const menuItemId = menu.items.find((item) => item.name === ITEM_NAME)!.id;

  async function createOrder(stage: "PENDING" | "UNPAID" | "PAID" | "PREPARING" | "READY") {
    const created = await customerApi.request.post("/api/orders", {
      data: { items: [{ menuItemId, quantity: 1 }] },
    });
    expect(created.status()).toBe(201);
    const { order } = (await created.json()) as {
      order: { id: number; orderNumber: string; totalSatang: number };
    };
    if (stage === "PENDING") return order;
    await post(operatorApi, `/api/orders/${order.id}/accept`);
    if (stage === "UNPAID") return order;
    await post(customerApi, `/api/orders/${order.id}/pay`, { amountSatang: order.totalSatang });
    if (stage === "PAID") return order;
    await post(operatorApi, `/api/orders/${order.id}/start`);
    if (stage === "PREPARING") return order;
    await post(operatorApi, `/api/orders/${order.id}/ready`);
    return order;
  }

  // The order under test: created, accepted and paid. The others show every other action.
  const target = await createOrder("PAID");
  const pending = await createOrder("PENDING");
  const unpaid = await createOrder("UNPAID");
  const preparing = await createOrder("PREPARING");
  const ready = await createOrder("READY");

  await logIn(page, operatorEmail, operatorPassword);
  await expect(page).toHaveURL(/\/operator\/orders$/);

  const filter = (name: string) =>
    page.getByRole("group", { name: "Status filter" }).getByRole("button", { name, exact: true });
  const row = (orderNumber: string) => page.locator("tbody tr").filter({ hasText: orderNumber });
  const action = (orderNumber: string, name: string) =>
    row(orderNumber).getByRole("button", { name, exact: true });

  await filter("All").click();
  await expect(action(pending.orderNumber, "Accept")).toBeVisible();
  await expect(action(target.orderNumber, "Start preparing")).toBeVisible();
  await expect(action(preparing.orderNumber, "Mark ready")).toBeVisible();
  await expect(action(ready.orderNumber, "Complete")).toBeVisible();
  await expect(row(unpaid.orderNumber).getByText("Awaiting payment")).toBeVisible();
  await expect(row(unpaid.orderNumber).getByText("Unpaid", { exact: true })).toBeVisible();
  await expect(row(unpaid.orderNumber).getByRole("button")).toHaveCount(0);
  await expect(row(target.orderNumber).getByText("Paid", { exact: true })).toBeVisible();
  await captureEvidence(page, "F-08-operator-actions.png");

  // Each step leaves the active filter, so the list reloads without the order.
  const steps = [
    { filterName: "Accepted", button: "Start preparing" },
    { filterName: "Preparing", button: "Mark ready" },
    { filterName: "Ready", button: "Complete" },
  ];
  for (const { filterName, button } of steps) {
    await filter(filterName).click();
    await expect(row(target.orderNumber).getByText(filterName, { exact: true })).toBeVisible();
    await action(target.orderNumber, button).click();
    await expect(row(target.orderNumber)).toHaveCount(0);
  }

  await filter("Completed").click();
  await expect(row(target.orderNumber).getByText("Completed", { exact: true })).toBeVisible();
  await expect(row(target.orderNumber).getByRole("button")).toHaveCount(0);
  await captureEvidence(page, "F-08-operator-completed.png");

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await logIn(page, customerEmail, customerPassword);
  await page.getByRole("link", { name: "My orders" }).click();
  await expect(row(target.orderNumber).getByText("Completed", { exact: true })).toBeVisible();
  await row(target.orderNumber).getByRole("link", { name: target.orderNumber }).click();

  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  const timeline = page.getByRole("listitem").filter({ hasText: /Order placed|→/ });
  await expect(timeline).toHaveCount(5);
  await expect(timeline).toContainText([
    "Order placed",
    "Pending → Accepted",
    "Accepted → Preparing",
    "Preparing → Ready",
    "Ready → Completed",
  ]);
  await captureEvidence(page, "F-08-customer-timeline.png");

  await customerApi.context().close();
  await operatorApi.context().close();
});
