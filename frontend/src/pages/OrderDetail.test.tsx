/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderDetail } from "./OrderDetail";
import { fetchOrder } from "../api/orders";
import { ApiRequestError } from "../api/client";
import * as AuthContextModule from "../auth/AuthContext";
import type { User } from "../api/auth";

vi.mock("../api/orders", () => ({ fetchOrder: vi.fn() }));

const mockedFetchOrder = vi.mocked(fetchOrder);

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
