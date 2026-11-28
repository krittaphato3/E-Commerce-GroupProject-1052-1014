/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderDetail } from "./OrderDetail";
import { cancelOrder, fetchOrder, type Order } from "../api/orders";
import { ApiRequestError } from "../api/client";
import * as AuthContextModule from "../auth/AuthContext";
import type { User } from "../api/auth";

vi.mock("../api/orders", () => ({ fetchOrder: vi.fn(), cancelOrder: vi.fn() }));

const mockedFetchOrder = vi.mocked(fetchOrder);
const mockedCancelOrder = vi.mocked(cancelOrder);

const CUSTOMER_USER: User = {
  id: 1,
  email: "customer1@campusbites.test",
  displayName: "Alice Customer",
  role: "CUSTOMER",
};

const OPERATOR_USER: User = {
  id: 3,
  email: "operator1@campusbites.test",
  displayName: "Staff Operator 1",
  role: "OPERATOR",
};

const SAMPLE_ORDER = {
  id: 1,
  orderNumber: "CB-000001",
  status: "PENDING" as const,
  paymentStatus: "UNPAID" as const,
  totalSatang: 6000,
  pickupNote: "At lunch",
  items: [
    {
      menuItemId: 1,
      itemName: "Basil Pork Rice",
      unitPriceSatang: 6000,
      quantity: 1,
      lineTotalSatang: 6000,
    },
  ],
  history: [
    {
      fromStatus: null,
      toStatus: "PENDING" as const,
      actorRole: "CUSTOMER" as const,
      createdAt: "2026-11-05T05:00:00.000Z",
    },
  ],
  createdAt: "2026-11-05T05:00:00.000Z",
  updatedAt: "2026-11-05T05:00:00.000Z",
  customer: {
    id: 1,
    displayName: "Alice Customer",
  },
};

function renderOrderDetail(user: User = CUSTOMER_USER, orderId = 1) {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("OrderDetail screen (Follow-ups 1 & 2, AC-27, AC-39)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("displays the server-provided error message when fetchOrder rejects with 403 ApiRequestError", async () => {
    mockedFetchOrder.mockRejectedValue(
      new ApiRequestError(403, "FORBIDDEN", "You do not have permission to view this order")
    );

    renderOrderDetail(CUSTOMER_USER, 1);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("You do not have permission to view this order");
  });

  it("displays the generic fallback message when fetchOrder rejects with network error", async () => {
    mockedFetchOrder.mockRejectedValue(new Error("Network failed"));

    renderOrderDetail(CUSTOMER_USER, 1);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not load this order. Please try again.");
  });

  it("renders 'My orders' linking to /orders when viewed by a CUSTOMER", async () => {
    mockedFetchOrder.mockResolvedValue({ order: SAMPLE_ORDER });

    renderOrderDetail(CUSTOMER_USER, 1);

    expect(await screen.findByText("CB-000001")).toBeTruthy();
    const link = screen.getByRole("link", { name: "My orders" });
    expect(link.getAttribute("href")).toBe("/orders");
  });

  it("renders role-aware link to /operator/orders and customer name when viewed by an OPERATOR", async () => {
    mockedFetchOrder.mockResolvedValue({ order: SAMPLE_ORDER });

    renderOrderDetail(OPERATOR_USER, 1);

    expect(await screen.findByText("CB-000001")).toBeTruthy();
    const link = screen.getByRole("link", { name: /orders/i });
    expect(link.getAttribute("href")).toBe("/operator/orders");
    expect(screen.getByText("Alice Customer")).toBeTruthy();
  });
});

describe("OrderDetail cancellation (AC-66)", () => {
  const CANCELLED_ORDER: Order = {
    ...SAMPLE_ORDER,
    status: "CANCELLED",
    history: [
      ...SAMPLE_ORDER.history,
      {
        fromStatus: "PENDING",
        toStatus: "CANCELLED",
        actorRole: "CUSTOMER",
        createdAt: "2026-11-05T05:05:00.000Z",
      },
    ],
  };
  const ACCEPTED_ORDER: Order = { ...SAMPLE_ORDER, status: "ACCEPTED" };

  const button = (name: string) => screen.queryByRole("button", { name }) as HTMLButtonElement | null;

  async function openConfirmation() {
    fireEvent.click(await screen.findByRole("button", { name: "Cancel order" }));
    expect(screen.getByText("Cancel this order?")).toBeTruthy();
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("TEST-66: shows Cancel order only to a Customer on a PENDING order", async () => {
    const cases = [
      { user: CUSTOMER_USER, order: SAMPLE_ORDER as Order, visible: true },
      { user: CUSTOMER_USER, order: ACCEPTED_ORDER, visible: false },
      { user: OPERATOR_USER, order: SAMPLE_ORDER as Order, visible: false },
      { user: OPERATOR_USER, order: ACCEPTED_ORDER, visible: false },
    ];

    for (const { user, order, visible } of cases) {
      mockedFetchOrder.mockResolvedValue({ order });
      renderOrderDetail(user);
      await screen.findByText("CB-000001");
      expect(button("Cancel order") !== null, `${user.role} ${order.status}`).toBe(visible);
      cleanup();
    }
  });

  it("TEST-66: Keep order closes the confirmation and sends nothing", async () => {
    mockedFetchOrder.mockResolvedValue({ order: SAMPLE_ORDER });
    renderOrderDetail();

    await openConfirmation();
    expect(mockedCancelOrder).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Keep order" }));

    expect(screen.queryByText("Cancel this order?")).toBeNull();
    expect(button("Cancel order")).not.toBeNull();
    expect(mockedCancelOrder).not.toHaveBeenCalled();
  });

  it("TEST-66: confirming shows Cancelling… with buttons disabled, then the returned order", async () => {
    mockedFetchOrder.mockResolvedValue({ order: SAMPLE_ORDER });
    let resolveCancel!: (value: { order: Order }) => void;
    mockedCancelOrder.mockReturnValue(
      new Promise((resolve) => {
        resolveCancel = resolve;
      })
    );
    renderOrderDetail();

    await openConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));

    expect(mockedCancelOrder).toHaveBeenCalledTimes(1);
    expect(mockedCancelOrder).toHaveBeenCalledWith(1);
    expect(button("Cancelling…")?.disabled).toBe(true);
    expect(button("Keep order")?.disabled).toBe(true);

    resolveCancel({ order: CANCELLED_ORDER });

    expect(await screen.findByText("Cancelled", { exact: true })).toBeTruthy();
    expect(within(screen.getByRole("list")).getByText(/Pending → Cancelled/)).toBeTruthy();
    expect(button("Cancel order")).toBeNull();
    expect(screen.queryByText("Cancel this order?")).toBeNull();
    // The returned order is rendered directly; no second load is needed.
    expect(mockedFetchOrder).toHaveBeenCalledTimes(1);
  });

  it("TEST-66: a 409 shows the alert and refetches the order", async () => {
    mockedFetchOrder
      .mockResolvedValueOnce({ order: SAMPLE_ORDER })
      .mockResolvedValue({ order: ACCEPTED_ORDER });
    mockedCancelOrder.mockRejectedValue(
      new ApiRequestError(409, "INVALID_TRANSITION", "Cannot transition order from ACCEPTED to CANCELLED")
    );
    renderOrderDetail();

    await openConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));

    expect(await screen.findByText("Accepted", { exact: true })).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("This order can no longer be cancelled.");
    expect(mockedFetchOrder).toHaveBeenCalledTimes(2);
    expect(button("Cancel order")).toBeNull();
  });

  it.each([
    [
      "API message",
      new ApiRequestError(403, "FORBIDDEN", "You do not have permission to cancel this order"),
      "You do not have permission to cancel this order",
    ],
    [
      "generic message for 500",
      new ApiRequestError(500, "INTERNAL_ERROR", "Something went wrong."),
      "Could not cancel this order. Please try again.",
    ],
    [
      "generic message for a network error",
      new Error("Network failed"),
      "Could not cancel this order. Please try again.",
    ],
  ])("TEST-66: other errors show an alert (%s) and keep the button", async (_label, error, message) => {
    mockedFetchOrder.mockResolvedValue({ order: SAMPLE_ORDER });
    mockedCancelOrder.mockRejectedValue(error);
    renderOrderDetail();

    await openConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));

    expect((await screen.findByRole("alert")).textContent).toContain(message);
    expect(button("Cancel order")).not.toBeNull();
    expect(mockedFetchOrder).toHaveBeenCalledTimes(1);
  });
});
