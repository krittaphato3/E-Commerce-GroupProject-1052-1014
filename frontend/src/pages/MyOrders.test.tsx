/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Orders } from "./Orders";
import { fetchMyOrders } from "../api/orders";

vi.mock("../api/orders", () => ({ fetchMyOrders: vi.fn() }));

const mockedFetchMyOrders = vi.mocked(fetchMyOrders);

function renderMyOrders() {
  return render(
    <MemoryRouter initialEntries={["/orders"]}>
      <Orders />
    </MemoryRouter>
  );
}

describe("My orders screen (AC-31)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("TEST-31: shows a loading state while the request is pending", () => {
    mockedFetchMyOrders.mockReturnValue(new Promise(() => {}));

    renderMyOrders();

    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("TEST-31: shows the empty state", async () => {
    mockedFetchMyOrders.mockResolvedValue({ orders: [] });

    renderMyOrders();

    expect(await screen.findByText("You have no orders yet.")).toBeTruthy();
  });

  it("TEST-31: shows an error alert when the request fails", async () => {
    mockedFetchMyOrders.mockRejectedValue(new Error("network down"));

    renderMyOrders();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not load your orders. Please try again.");
  });

  it("TEST-31: renders a table with one row per order", async () => {
    mockedFetchMyOrders.mockResolvedValue({
      orders: [
        {
          id: 2,
          orderNumber: "CB-000002",
          status: "ACCEPTED",
          paymentStatus: "PAID",
          totalSatang: 15000,
          itemCount: 2,
          createdAt: "2026-11-06T05:00:00.000Z",
        },
        {
          id: 1,
          orderNumber: "CB-000001",
          status: "PENDING",
          paymentStatus: "UNPAID",
          totalSatang: 6000,
          itemCount: 1,
          createdAt: "2026-11-05T05:00:00.000Z",
        },
      ],
    });

    renderMyOrders();

    const firstNumber = await screen.findByText("CB-000002");
    expect(firstNumber).toBeTruthy();

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByText("CB-000001")).toBeTruthy();
    expect(within(table).getByText("฿150.00")).toBeTruthy();
    expect(within(table).getByText("฿60.00")).toBeTruthy();
    expect(within(table).getByText("Accepted")).toBeTruthy();
    expect(within(table).getByText("Pending")).toBeTruthy();
  });
});
