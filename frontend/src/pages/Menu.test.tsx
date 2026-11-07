/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Menu } from "./Menu";
import * as AuthContextModule from "../auth/AuthContext";
import { fetchMenu } from "../api/menu";
import { createOrder } from "../api/orders";
import { ApiRequestError } from "../api/client";
import type { User } from "../api/auth";

vi.mock("../api/menu", () => ({ fetchMenu: vi.fn() }));
vi.mock("../api/orders", () => ({ createOrder: vi.fn() }));

const mockedFetchMenu = vi.mocked(fetchMenu);
const mockedCreateOrder = vi.mocked(createOrder);

const CUSTOMER: User = {
  id: 1,
  email: "customer1@campusbites.test",
  displayName: "Alice Customer",
  role: "CUSTOMER",
};

const TWO_ITEMS = {
  items: [
    {
      id: 1,
      name: "Basil Pork Rice",
      description: "Spicy stir-fried minced pork with holy basil and jasmine rice",
      priceSatang: 6000,
      stockQty: 30,
      isAvailable: true,
      available: true,
    },
    {
      id: 4,
      name: "Thai Iced Tea",
      description: "Traditional sweet Thai tea with milk",
      priceSatang: 3000,
      stockQty: 50,
      isAvailable: true,
      available: true,
    },
  ],
};

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

function renderMenu(user: User | null = CUSTOMER) {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={["/menu"]}>
      <Menu />
      <LocationProbe />
    </MemoryRouter>
  );
}

async function addToCart(name: string) {
  fireEvent.click(await screen.findByRole("button", { name: `Add ${name} to cart` }));
}

describe("F-02 Menu screen (AC-12, AC-13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("TEST-13: shows the loading message while the menu request is pending", () => {
    mockedFetchMenu.mockReturnValue(new Promise(() => {}));

    renderMenu();

    expect(screen.getByText("Loading menu…")).toBeTruthy();
  });

  it("TEST-13: shows the empty state when the menu has no items", async () => {
    mockedFetchMenu.mockResolvedValue({ items: [] });

    renderMenu();

    expect(await screen.findByText("The menu is empty.")).toBeTruthy();
  });

  it("TEST-13: shows an error message with a Retry button that loads the menu again", async () => {
    mockedFetchMenu.mockRejectedValueOnce(new Error("network down"));
    mockedFetchMenu.mockResolvedValueOnce(TWO_ITEMS);

    renderMenu();

    expect(
      await screen.findByText("Could not load the menu. Please try again.")
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    const cards = await screen.findAllByText("Basil Pork Rice");
    expect(cards.length).toBeGreaterThan(0);
    expect(mockedFetchMenu).toHaveBeenCalledTimes(2);
  });

  it("TEST-12-ish (component): renders THB prices, stock hints and a disabled add button for sold-out items", async () => {
    mockedFetchMenu.mockResolvedValue({
      items: [
        TWO_ITEMS.items[0],
        {
          id: 6,
          name: "Chicken Sandwich",
          description: "Grilled chicken sandwich (sold out test)",
          priceSatang: 7000,
          stockQty: 0,
          isAvailable: true,
          available: false,
        },
      ],
    });

    renderMenu();

    expect(await screen.findByText("฿60.00")).toBeTruthy();
    expect(screen.getByText("Sold out")).toBeTruthy();

    const addSoldOut = screen.getByRole("button", {
      name: "Add Chicken Sandwich to cart",
    }) as HTMLButtonElement;
    expect(addSoldOut.disabled).toBe(true);
  });

  it("TEST-30: a 409 ITEM_UNAVAILABLE keeps the cart contents and does not navigate away", async () => {
    mockedFetchMenu.mockResolvedValue(TWO_ITEMS);
    mockedCreateOrder.mockRejectedValue(
      new ApiRequestError(409, "ITEM_UNAVAILABLE", "Chicken Sandwich is sold out.", {
        menuItemId: 6,
        requested: 1,
        available: 0,
      })
    );

    renderMenu();

    await addToCart("Basil Pork Rice");
    await addToCart("Thai Iced Tea");

    const cartBefore = screen.getByRole("region", { name: "Cart" });
    expect(within(cartBefore).getAllByRole("listitem")).toHaveLength(2);
    expect(within(cartBefore).getByText("Basil Pork Rice")).toBeTruthy();
    expect(within(cartBefore).getByText("Thai Iced Tea")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Chicken Sandwich is sold out.");

    const cartAfter = screen.getByRole("region", { name: "Cart" });
    expect(within(cartAfter).getAllByRole("listitem")).toHaveLength(2);
    expect(within(cartAfter).getByText("Basil Pork Rice")).toBeTruthy();
    expect(within(cartAfter).getByText("Thai Iced Tea")).toBeTruthy();
    expect(screen.getByTestId("location").textContent).toBe("/menu");
    expect(mockedCreateOrder).toHaveBeenCalledTimes(1);
  });

  it("TEST-30 (supporting): an anonymous visitor sees a login link instead of the place-order button", async () => {
    mockedFetchMenu.mockResolvedValue(TWO_ITEMS);

    renderMenu(null);

    expect(await screen.findByRole("link", { name: "Log in to order" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Place order" })).toBeNull();
  });

  it("Follow-up 5: caps the card stepper, Add button, and cart quantity at item.stockQty when stockQty is below 10", async () => {
    mockedFetchMenu.mockResolvedValue({
      items: [
        {
          id: 5,
          name: "Mango Sticky Rice",
          description: "Sweet mango with sticky rice",
          priceSatang: 8000,
          stockQty: 2,
          isAvailable: true,
          available: true,
        },
      ],
    });

    renderMenu();

    const card = (await screen.findByText("Mango Sticky Rice")).closest("article")!;
    const increaseBtn = within(card).getByRole("button", {
      name: "Increase menu quantity for Mango Sticky Rice",
    }) as HTMLButtonElement;

    // Step 1: 1 -> 2
    fireEvent.click(increaseBtn);
    expect(within(card).getByText("2")).toBeTruthy();
    // At stockQty 2, + button on card should be disabled
    expect(increaseBtn.disabled).toBe(true);

    // Add 2 to cart
    fireEvent.click(within(card).getByRole("button", { name: "Add Mango Sticky Rice to cart" }));

    const cart = screen.getByRole("region", { name: "Cart" });
    const cartIncreaseBtn = within(cart).getByRole("button", {
      name: "Increase quantity in cart for Mango Sticky Rice",
    }) as HTMLButtonElement;
    expect(cartIncreaseBtn.disabled).toBe(true);
  });

  it("Follow-up 5 (stockQty 0 edge case): sold-out item disables card stepper, + button, and Add button", async () => {
    mockedFetchMenu.mockResolvedValue({
      items: [
        {
          id: 6,
          name: "Chicken Sandwich",
          description: "Sold out sandwich",
          priceSatang: 7000,
          stockQty: 0,
          isAvailable: true,
          available: false,
        },
      ],
    });

    renderMenu();

    const card = (await screen.findByText("Chicken Sandwich")).closest("article")!;
    expect(within(card).getByText("Sold out")).toBeTruthy();

    const decBtn = within(card).getByRole("button", {
      name: "Decrease menu quantity for Chicken Sandwich",
    }) as HTMLButtonElement;
    const incBtn = within(card).getByRole("button", {
      name: "Increase menu quantity for Chicken Sandwich",
    }) as HTMLButtonElement;
    const addBtn = within(card).getByRole("button", {
      name: "Add Chicken Sandwich to cart",
    }) as HTMLButtonElement;

    expect(decBtn.disabled).toBe(true);
    expect(incBtn.disabled).toBe(true);
    expect(addBtn.disabled).toBe(true);
  });

  it("Follow-up 5 (stockQty 1 edge case): card stepper + is disabled at 1, cart line capped at 1, cart + disabled", async () => {
    mockedFetchMenu.mockResolvedValue({
      items: [
        {
          id: 7,
          name: "Single Item",
          description: "Only one in stock",
          priceSatang: 5000,
          stockQty: 1,
          isAvailable: true,
          available: true,
        },
      ],
    });

    renderMenu();

    const card = (await screen.findByText("Single Item")).closest("article")!;
    const decBtn = within(card).getByRole("button", {
      name: "Decrease menu quantity for Single Item",
    }) as HTMLButtonElement;
    const incBtn = within(card).getByRole("button", {
      name: "Increase menu quantity for Single Item",
    }) as HTMLButtonElement;
    const addBtn = within(card).getByRole("button", {
      name: "Add Single Item to cart",
    }) as HTMLButtonElement;

    // Quantity starts at 1; with stockQty = 1, + is disabled immediately
    expect(within(card).getByText("1")).toBeTruthy();
    expect(decBtn.disabled).toBe(true);
    expect(incBtn.disabled).toBe(true);
    expect(addBtn.disabled).toBe(false);

    // Add 1 to cart
    fireEvent.click(addBtn);

    const cart = screen.getByRole("region", { name: "Cart" });
    const cartIncBtn = within(cart).getByRole("button", {
      name: "Increase quantity in cart for Single Item",
    }) as HTMLButtonElement;
    expect(cartIncBtn.disabled).toBe(true);

    // Clicking Add on the card again does not exceed stockQty 1
    fireEvent.click(addBtn);
    expect(within(cart).getByText("1")).toBeTruthy();
    expect(cartIncBtn.disabled).toBe(true);
  });
});
