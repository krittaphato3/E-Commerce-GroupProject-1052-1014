/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { OrderDetail } from "./OrderDetail";
import { cancelOrder, fetchOrder, payOrder, type Order } from "../api/orders";
import { ApiRequestError } from "../api/client";
import * as AuthContextModule from "../auth/AuthContext";
import type { User } from "../api/auth";

vi.mock("../api/orders", () => ({
  fetchOrder: vi.fn(),
  cancelOrder: vi.fn(),
  payOrder: vi.fn(),
}));

const mockedFetchOrder = vi.mocked(fetchOrder);
const mockedCancelOrder = vi.mocked(cancelOrder);
const mockedPayOrder = vi.mocked(payOrder);

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
      note: null,
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
        note: null,
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

describe("OrderDetail simulated payment (AC-75)", () => {
  const PENDING_ORDER: Order = { ...SAMPLE_ORDER, totalSatang: 15000 };
  const ACCEPTED_ORDER: Order = { ...PENDING_ORDER, status: "ACCEPTED" };
  const PAID_ORDER: Order = { ...ACCEPTED_ORDER, paymentStatus: "PAID" };
  const CONFIRM_TEXT = "Pay ฿150.00 (simulated)?";
  const PENDING_HINT = "You can pay after the shop accepts this order.";

  const button = (name: string) => screen.queryByRole("button", { name }) as HTMLButtonElement | null;

  async function openConfirmation() {
    fireEvent.click(await screen.findByRole("button", { name: "Pay" }));
    expect(screen.getByText(CONFIRM_TEXT)).toBeTruthy();
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("TEST-75: shows Pay only to a Customer on an ACCEPTED, UNPAID order", async () => {
    const cases = [
      { user: CUSTOMER_USER, order: PENDING_ORDER, visible: false, hint: true },
      { user: CUSTOMER_USER, order: ACCEPTED_ORDER, visible: true, hint: false },
      { user: CUSTOMER_USER, order: PAID_ORDER, visible: false, hint: false },
      { user: OPERATOR_USER, order: PENDING_ORDER, visible: false, hint: false },
      { user: OPERATOR_USER, order: ACCEPTED_ORDER, visible: false, hint: false },
      { user: OPERATOR_USER, order: PAID_ORDER, visible: false, hint: false },
    ];

    for (const { user, order, visible, hint } of cases) {
      const label = `${user.role} ${order.status} ${order.paymentStatus}`;
      mockedFetchOrder.mockResolvedValue({ order });
      renderOrderDetail(user);
      await screen.findByText("CB-000001");
      expect(button("Pay") !== null, label).toBe(visible);
      expect(screen.queryByText(PENDING_HINT) !== null, label).toBe(hint);
      cleanup();
    }
  });

  it("TEST-75: the confirmation shows the total with no input, and Back sends nothing", async () => {
    mockedFetchOrder.mockResolvedValue({ order: ACCEPTED_ORDER });
    renderOrderDetail();

    await openConfirmation();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.queryByText(CONFIRM_TEXT)).toBeNull();
    expect(button("Pay")).not.toBeNull();
    expect(mockedPayOrder).not.toHaveBeenCalled();
  });

  it("TEST-75: confirming sends 15000, shows Paying… with buttons disabled, then Paid", async () => {
    mockedFetchOrder.mockResolvedValue({ order: ACCEPTED_ORDER });
    let resolvePay!: (value: { order: Order }) => void;
    mockedPayOrder.mockReturnValue(
      new Promise((resolve) => {
        resolvePay = resolve;
      })
    );
    renderOrderDetail();

    await openConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Confirm payment" }));

    expect(mockedPayOrder).toHaveBeenCalledTimes(1);
    expect(mockedPayOrder).toHaveBeenCalledWith(1, 15000);
    expect(button("Paying…")?.disabled).toBe(true);
    expect(button("Back")?.disabled).toBe(true);

    resolvePay({ order: PAID_ORDER });

    expect(await screen.findByText("Paid", { exact: true })).toBeTruthy();
    expect(screen.getByText("Accepted", { exact: true })).toBeTruthy();
    expect(button("Pay")).toBeNull();
    expect(screen.queryByText(CONFIRM_TEXT)).toBeNull();
    expect(mockedFetchOrder).toHaveBeenCalledTimes(1);
  });

  it.each([
    [409, "INVALID_TRANSITION", "Cannot pay an order that is PAID", PAID_ORDER],
    [400, "VALIDATION_ERROR", "Payment amount must equal the order total.", ACCEPTED_ORDER],
  ])("TEST-75: a %i shows the API message and refetches the order", async (status, code, message, reloaded) => {
    mockedFetchOrder
      .mockResolvedValueOnce({ order: ACCEPTED_ORDER })
      .mockResolvedValue({ order: reloaded });
    mockedPayOrder.mockRejectedValue(new ApiRequestError(status, code, message));
    renderOrderDetail();

    await openConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Confirm payment" }));

    // Wait for the reloaded page itself, not the render between the error and the reload.
    await waitFor(() => {
      expect(mockedFetchOrder).toHaveBeenCalledTimes(2);
      expect(screen.queryByText("Loading order…")).toBeNull();
    });
    expect(screen.getByRole("alert").textContent).toContain(message);
    expect(screen.queryByText("Paid", { exact: true }) !== null).toBe(
      reloaded.paymentStatus === "PAID"
    );
    expect(button("Pay") !== null).toBe(reloaded.paymentStatus === "UNPAID");
  });

  it.each([
    ["a 403", new ApiRequestError(403, "FORBIDDEN", "You do not have permission to pay this order")],
    ["a 500", new ApiRequestError(500, "INTERNAL_ERROR", "Something went wrong.")],
    ["a network error", new Error("Network failed")],
  ])("TEST-75: %s shows a generic message and keeps the button", async (_label, error) => {
    mockedFetchOrder.mockResolvedValue({ order: ACCEPTED_ORDER });
    mockedPayOrder.mockRejectedValue(error);
    renderOrderDetail();

    await openConfirmation();
    fireEvent.click(screen.getByRole("button", { name: "Confirm payment" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Could not pay for this order. Please try again."
    );
    expect(button("Pay")).not.toBeNull();
    expect(mockedFetchOrder).toHaveBeenCalledTimes(1);
  });
});

describe("OrderDetail fulfilment progress (AC-86)", () => {
  const STEPS = [
    ["PENDING", "ACCEPTED", "Pending → Accepted"],
    ["ACCEPTED", "PREPARING", "Accepted → Preparing"],
    ["PREPARING", "READY", "Preparing → Ready"],
    ["READY", "COMPLETED", "Ready → Completed"],
  ] as const;

  /** A paid order after `count` operator steps. */
  function orderAfter(count: number): Order {
    return {
      ...SAMPLE_ORDER,
      status: STEPS[count - 1][1],
      paymentStatus: "PAID",
      history: [
        ...SAMPLE_ORDER.history,
        ...STEPS.slice(0, count).map(([fromStatus, toStatus], index) => ({
          fromStatus,
          toStatus,
          actorRole: "OPERATOR" as const,
          createdAt: `2026-11-05T05:0${index + 1}:00.000Z`,
          note: null,
        })),
      ],
    };
  }

  function expectTimeline(count: number) {
    const entries = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(entries).toHaveLength(count + 1);
    expect(entries[0].textContent).toContain("Order placed");
    STEPS.slice(0, count).forEach(([, , text], index) => {
      expect(entries[index + 1].textContent).toContain(text);
      expect(entries[index + 1].textContent).toContain("OPERATOR");
    });
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("TEST-86: a completed order shows Completed, the full timeline and no actions", async () => {
    mockedFetchOrder.mockResolvedValue({ order: orderAfter(4) });
    renderOrderDetail();

    expect(await screen.findByText("Completed", { exact: true })).toBeTruthy();
    expect(screen.getByText("Paid", { exact: true })).toBeTruthy();
    expectTimeline(4);
    expect(screen.queryByRole("button", { name: "Pay" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel order" })).toBeNull();
  });

  it.each([
    [2, "Preparing"],
    [3, "Ready"],
    [4, "Completed"],
  ] as const)("TEST-86: after %i steps a load shows %s and the timeline", async (count, label) => {
    mockedFetchOrder.mockResolvedValue({ order: orderAfter(count) });
    renderOrderDetail();

    expect(await screen.findByText(label, { exact: true })).toBeTruthy();
    expectTimeline(count);
  });

  it("TEST-86: the page does not poll for new status (DEC-38)", async () => {
    vi.useFakeTimers();
    mockedFetchOrder.mockResolvedValue({ order: orderAfter(2) });
    renderOrderDetail();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    });

    expect(screen.getByText("Preparing", { exact: true })).toBeTruthy();
    expect(mockedFetchOrder).toHaveBeenCalledTimes(1);
  });
});

describe("OrderDetail rejection reason (AC-103)", () => {
  // Markup in the note proves it is rendered as plain text.
  const NOTE = "<b>Sold out</b> of basil today";
  const REJECTED_ORDER: Order = {
    ...SAMPLE_ORDER,
    status: "REJECTED",
    history: [
      ...SAMPLE_ORDER.history,
      {
        fromStatus: "PENDING",
        toStatus: "REJECTED",
        actorRole: "OPERATOR",
        createdAt: "2026-11-05T05:05:00.000Z",
        note: NOTE,
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    ["Customer", CUSTOMER_USER],
    ["Operator", OPERATOR_USER],
  ])("TEST-103: the %s sees Rejected and the reason as wrapped plain text, with no actions", async (_role, user) => {
    mockedFetchOrder.mockResolvedValue({ order: REJECTED_ORDER });
    const { container } = renderOrderDetail(user);

    expect(await screen.findByText("Rejected", { exact: true })).toBeTruthy();
    expect(screen.getByText("Reason for rejection:")).toBeTruthy();
    const note = screen.getByText(NOTE, { exact: false });
    expect(note.textContent).toContain(NOTE);
    expect(note.closest(".text-break")).not.toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(screen.queryByRole("button", { name: "Pay" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel order" })).toBeNull();
  });

  it("TEST-103: an order that is not rejected shows no reason line", async () => {
    mockedFetchOrder.mockResolvedValue({ order: SAMPLE_ORDER });
    renderOrderDetail();

    await screen.findByText("CB-000001");
    expect(screen.queryByText("Reason for rejection:")).toBeNull();
  });
});
