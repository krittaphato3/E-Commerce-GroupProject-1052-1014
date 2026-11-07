/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OperatorOrders } from "./OperatorOrders";
import { fetchOperatorOrders, acceptOrder } from "../api/orders";
import { ApiRequestError } from "../api/client";

vi.mock("../api/orders", () => ({
  fetchOperatorOrders: vi.fn(),
  acceptOrder: vi.fn(),
}));

const mockedFetchOperatorOrders = vi.mocked(fetchOperatorOrders);
const mockedAcceptOrder = vi.mocked(acceptOrder);

function renderOperatorOrders() {
  return render(
    <MemoryRouter initialEntries={["/operator/orders"]}>
      <OperatorOrders />
    </MemoryRouter>
  );
}

const SAMPLE_ORDERS = [
  {
    id: 1,
    orderNumber: "CB-000001",
    status: "PENDING" as const,
    paymentStatus: "UNPAID" as const,
    totalSatang: 6000,
    itemCount: 1,
    createdAt: "2026-11-05T05:00:00.000Z",
    customer: { id: 1, displayName: "Alice Customer" },
  },
  {
    id: 2,
    orderNumber: "CB-000002",
    status: "ACCEPTED" as const,
    paymentStatus: "PAID" as const,
    totalSatang: 12000,
    itemCount: 2,
    createdAt: "2026-11-06T05:00:00.000Z",
    customer: { id: 2, displayName: "Bob Customer" },
  },
];

describe("OperatorOrders screen (AC-32, AC-33, AC-34, AC-35, AC-41)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows Loading orders… while the request is pending", () => {
    mockedFetchOperatorOrders.mockReturnValue(new Promise(() => {}));
    renderOperatorOrders();
    expect(screen.getByText("Loading orders…")).toBeTruthy();
  });

  it("shows No orders to show. when the list is empty", async () => {
    mockedFetchOperatorOrders.mockResolvedValue({ orders: [] });
    renderOperatorOrders();
    expect(await screen.findByText("No orders to show.")).toBeTruthy();
  });

  it("shows an error alert and retries when Retry is clicked", async () => {
    mockedFetchOperatorOrders.mockRejectedValueOnce(new Error("network failure"));
    mockedFetchOperatorOrders.mockResolvedValueOnce({ orders: SAMPLE_ORDERS });

    renderOperatorOrders();
    expect(await screen.findByRole("alert")).toBeTruthy();

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryBtn);

    expect(await screen.findByText("CB-000001")).toBeTruthy();
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(2);
  });

  it("renders incoming orders table, filters by status with PENDING as default", async () => {
    mockedFetchOperatorOrders.mockResolvedValue({ orders: SAMPLE_ORDERS });
    renderOperatorOrders();

    expect(await screen.findByText("CB-000001")).toBeTruthy();
    expect(screen.getByText("Alice Customer")).toBeTruthy();
    expect(screen.getByText("฿60.00")).toBeTruthy();

    // Default filter should have been requested with "PENDING"
    expect(mockedFetchOperatorOrders).toHaveBeenCalledWith("PENDING");

    // Check Accept button is only present on PENDING order
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // header + 2 rows = 3 rows
    expect(rows).toHaveLength(3);

    const pendingRow = rows[1];
    expect(within(pendingRow).getByRole("button", { name: "Accept" })).toBeTruthy();

    const acceptedRow = rows[2];
    expect(within(acceptedRow).queryByRole("button", { name: "Accept" })).toBeNull();

    // Changing filter to ALL requests without status
    const allFilter = screen.getByRole("button", { name: "All" });
    fireEvent.click(allFilter);
    expect(mockedFetchOperatorOrders).toHaveBeenCalledWith(undefined);
  });

  it("accepts a PENDING order, updates the row in place to Accepted without refetching", async () => {
    mockedFetchOperatorOrders.mockResolvedValue({ orders: [SAMPLE_ORDERS[0]] });
    mockedAcceptOrder.mockResolvedValue({
      order: {
        ...SAMPLE_ORDERS[0],
        status: "ACCEPTED",
        pickupNote: null,
        items: [],
        history: [],
        updatedAt: "2026-11-06T06:00:00.000Z",
      },
    });

    renderOperatorOrders();
    expect(await screen.findByText("CB-000001")).toBeTruthy();

    const acceptBtn = screen.getByRole("button", { name: "Accept" });
    fireEvent.click(acceptBtn);

    // After accept, status badge becomes Accepted and Accept button disappears
    expect(await screen.findByText("Accepted")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();

    // fetchOperatorOrders should NOT have been called again (in-place update)
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(1);
    expect(mockedAcceptOrder).toHaveBeenCalledWith(1);
  });

  it("on 409 INVALID_TRANSITION, shows error alert and reloads order list", async () => {
    mockedFetchOperatorOrders.mockResolvedValue({ orders: [SAMPLE_ORDERS[0]] });
    mockedAcceptOrder.mockRejectedValue(
      new ApiRequestError(409, "INVALID_TRANSITION", "Cannot transition order from ACCEPTED to ACCEPTED", {
        from: "ACCEPTED",
        to: "ACCEPTED",
      })
    );

    renderOperatorOrders();
    expect(await screen.findByText("CB-000001")).toBeTruthy();

    const acceptBtn = screen.getByRole("button", { name: "Accept" });
    fireEvent.click(acceptBtn);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("This order was already handled.");

    // Reload was triggered
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(2);
  });

  it("reconciles and displays the accepted order when switching to Accepted tab while accept is in flight", async () => {
    const pendingOrder = SAMPLE_ORDERS[0];
    const acceptedOrder: OperatorOrderSummary = { ...SAMPLE_ORDERS[0], status: "ACCEPTED" };

    let resolveAccept!: (value: { order: Order }) => void;
    const acceptPromise = new Promise<{ order: Order }>((resolve) => {
      resolveAccept = resolve;
    });

    let fetchCount = 0;
    mockedFetchOperatorOrders.mockImplementation(async () => {
      fetchCount += 1;
      if (fetchCount === 1) {
        return { orders: [pendingOrder] };
      }
      if (fetchCount === 2) {
        return { orders: [] };
      }
      return { orders: [acceptedOrder] };
    });

    mockedAcceptOrder.mockImplementation(() => acceptPromise);

    renderOperatorOrders();
    expect(await screen.findByText("CB-000001")).toBeTruthy();

    // 1. Operator clicks Accept on Pending tab
    const acceptBtn = screen.getByRole("button", { name: "Accept" });
    fireEvent.click(acceptBtn);

    // 2. While accept request is in flight, switch to "Accepted" tab
    const acceptedTab = screen.getByRole("button", { name: "Accepted" });
    fireEvent.click(acceptedTab);

    // List fetch resolves empty
    expect(await screen.findByText("No orders to show.")).toBeTruthy();
    expect(screen.queryByText("CB-000001")).toBeNull();

    // 3. Now the accept request resolves successfully
    resolveAccept({
      order: {
        ...acceptedOrder,
        pickupNote: null,
        items: [],
        history: [],
        updatedAt: "2026-11-06T06:00:00.000Z",
      },
    });

    // 4. Assert the accepted row appears in the Accepted tab
    expect(await screen.findByText("CB-000001")).toBeTruthy();
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(3);
  });
});
