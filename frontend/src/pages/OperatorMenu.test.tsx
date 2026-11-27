// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OperatorMenu } from "./OperatorMenu";
import { ApiRequestError } from "../api/client";
import * as menuApi from "../api/menu";

vi.mock("../api/menu", () => ({
  fetchMenu: vi.fn(),
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
}));

const SAMPLE_ITEMS: menuApi.MenuItem[] = [
  {
    id: 1,
    name: "Basil Pork Rice",
    description: "Stir-fried basil pork with rice",
    priceSatang: 6000,
    stockQty: 15,
    isAvailable: true,
    available: true,
  },
  {
    id: 2,
    name: "Thai Iced Tea",
    description: "Sweet milk tea",
    priceSatang: 3500,
    stockQty: 0,
    isAvailable: false,
    available: false,
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <OperatorMenu />
    </MemoryRouter>
  );
}

describe("F-05 Operator Menu Management UI (AC-56)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TEST-56: renders loading, empty, error, list states, field errors, exact satang conversion, and minimal PATCH payload", async () => {
    // 1. Pending state
    vi.mocked(menuApi.fetchMenu).mockReturnValueOnce(new Promise(() => {}));
    const { unmount } = renderPage();
    expect(screen.getByText("Loading menu…")).toBeDefined();
    unmount();

    // 2. Empty state
    vi.mocked(menuApi.fetchMenu).mockResolvedValueOnce({ items: [] });
    const emptyView = renderPage();
    await waitFor(() => {
      expect(screen.getByText("No menu items yet.")).toBeDefined();
    });
    emptyView.unmount();

    // 3. Error state with Retry -> recovers to list
    vi.mocked(menuApi.fetchMenu)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ items: SAMPLE_ITEMS });
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(screen.getByText("Basil Pork Rice")).toBeDefined();
    });
    expect(screen.getByText("Enabled")).toBeDefined();
    expect(screen.getByText("Disabled")).toBeDefined();

    // 4. Create with 400 details keeps typed values, then succeeds with exact satang 5999
    fireEvent.click(screen.getByRole("button", { name: "New item" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Mango Sticky Rice" } });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Sweet coconut sticky rice" },
    });
    fireEvent.change(screen.getByLabelText("Price (THB)"), { target: { value: "59.99" } });
    fireEvent.change(screen.getByLabelText("Stock"), { target: { value: "10" } });

    vi.mocked(menuApi.createMenuItem).mockRejectedValueOnce(
      new ApiRequestError(400, "VALIDATION_ERROR", "Invalid request body", [
        { field: "name", message: "A menu item with this name already exists" },
      ])
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("A menu item with this name already exists")).toBeDefined();
    });
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Mango Sticky Rice");
    expect((screen.getByLabelText("Price (THB)") as HTMLInputElement).value).toBe("59.99");

    const createdItem: menuApi.MenuItem = {
      id: 3,
      name: "Mango Sticky Rice",
      description: "Sweet coconut sticky rice",
      priceSatang: 5999,
      stockQty: 10,
      isAvailable: true,
      available: true,
    };
    vi.mocked(menuApi.createMenuItem).mockResolvedValueOnce({ item: createdItem });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(menuApi.createMenuItem).toHaveBeenLastCalledWith({
        name: "Mango Sticky Rice",
        description: "Sweet coconut sticky rice",
        priceSatang: 5999,
        stockQty: 10,
        isAvailable: true,
      });
    });

    // 5. Edit only price: Save disabled initially, PATCH sends only priceSatang
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.click(editButtons[0]);

    const saveBtn = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);

    const priceInput = screen.getByLabelText("Price (THB)");
    fireEvent.change(priceInput, { target: { value: "75.00" } });
    expect(saveBtn.disabled).toBe(false);

    vi.mocked(menuApi.updateMenuItem).mockResolvedValueOnce({
      item: { ...SAMPLE_ITEMS[0], priceSatang: 7500 },
    });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(menuApi.updateMenuItem).toHaveBeenCalledWith(1, { priceSatang: 7500 });
    });
  });
});
