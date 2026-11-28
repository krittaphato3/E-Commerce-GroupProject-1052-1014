/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OperatorOrders } from "./OperatorOrders";
import {
  fetchOperatorOrders,
  acceptOrder,
  rejectOrder,
  startOrder,
  markOrderReady,
  completeOrder,
  type OperatorOrderSummary,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "../api/orders";
import { ApiRequestError } from "../api/client";

vi.mock("../api/orders", () => ({
  fetchOperatorOrders: vi.fn(),
  acceptOrder: vi.fn(),
  rejectOrder: vi.fn(),
  startOrder: vi.fn(),
  markOrderReady: vi.fn(),
  completeOrder: vi.fn(),
}));

const mockedFetchOperatorOrders = vi.mocked(fetchOperatorOrders);
const mockedAcceptOrder = vi.mocked(acceptOrder);
const mockedRejectOrder = vi.mocked(rejectOrder);
const mockedStartOrder = vi.mocked(startOrder);
const mockedMarkOrderReady = vi.mocked(markOrderReady);
const mockedCompleteOrder = vi.mocked(completeOrder);

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
    const row = (await screen.findByText("CB-000001")).closest("tr")!;
    expect(within(row).getByText("Accepted")).toBeTruthy();
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(3);
  });
});

describe("OperatorOrders fulfilment actions (AC-86)", () => {
  const STATUSES: OrderStatus[] = [
    "PENDING",
    "ACCEPTED",
    "REJECTED",
    "CANCELLED",
    "PREPARING",
    "READY",
    "COMPLETED",
  ];
  const STATUS_TEXT: Record<OrderStatus, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    PREPARING: "Preparing",
    READY: "Ready",
    COMPLETED: "Completed",
  };

  const summary = (id: number, status: OrderStatus, paymentStatus: PaymentStatus): OperatorOrderSummary => ({
    ...SAMPLE_ORDERS[0],
    id,
    orderNumber: `CB-${String(id).padStart(6, "0")}`,
    status,
    paymentStatus,
  });

  /** One row in every status, unpaid and paid. */
  const ALL_ROWS = STATUSES.flatMap((status, index) => [
    summary(index * 2 + 1, status, "UNPAID"),
    summary(index * 2 + 2, status, "PAID"),
  ]);

  function expectedActions(order: OperatorOrderSummary): string[] {
    if (order.status === "PENDING") return ["Accept", "Reject"];
    if (order.status === "ACCEPTED") return order.paymentStatus === "PAID" ? ["Start preparing"] : [];
    if (order.status === "PREPARING") return ["Mark ready"];
    if (order.status === "READY") return ["Complete"];
    return [];
  }

  const detail = (order: OperatorOrderSummary, status: OrderStatus): Order => ({
    ...order,
    status,
    pickupNote: null,
    items: [],
    history: [],
    updatedAt: "2026-11-28T06:00:00.000Z",
  });

  const ACTIONS = [
    { button: "Start preparing", from: "ACCEPTED", to: "PREPARING", next: "Mark ready", mock: mockedStartOrder },
    { button: "Mark ready", from: "PREPARING", to: "READY", next: "Complete", mock: mockedMarkOrderReady },
    { button: "Complete", from: "READY", to: "COMPLETED", next: null, mock: mockedCompleteOrder },
  ] as const;

  async function rowOf(orderNumber: string) {
    return (await screen.findByText(orderNumber)).closest("tr")!;
  }

  function clickFilter(name: string) {
    fireEvent.click(within(screen.getByRole("group", { name: "Status filter" })).getByRole("button", { name }));
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("TEST-86: every row shows its payment badge and only the valid action", async () => {
    mockedFetchOperatorOrders.mockResolvedValue({ orders: ALL_ROWS });
    renderOperatorOrders();
    await screen.findByText("CB-000001");

    expect(screen.getByRole("columnheader", { name: "Payment" })).toBeTruthy();

    for (const order of ALL_ROWS) {
      const label = `${order.status} ${order.paymentStatus}`;
      const row = await rowOf(order.orderNumber);
      const paymentText = order.paymentStatus === "PAID" ? "Paid" : "Unpaid";
      expect(within(row).getByText(paymentText, { exact: true }).className, label).toContain("badge");

      const buttons = within(row).queryAllByRole("button").map((button) => button.textContent);
      expect(buttons, label).toEqual(expectedActions(order));
      expect(within(row).queryByText("Awaiting payment") !== null, label).toBe(
        order.status === "ACCEPTED" && order.paymentStatus === "UNPAID"
      );
    }
  });

  it.each(ACTIONS)(
    "TEST-86: $button shows Updating… while pending, then the row shows the new status",
    async ({ button, from, to, next, mock }) => {
      const order = summary(1, from, "PAID");
      const other = summary(2, from, "PAID");
      mockedFetchOperatorOrders.mockResolvedValue({ orders: [order, other] });
      let resolveAction!: (value: { order: Order }) => void;
      mock.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve;
        })
      );
      renderOperatorOrders();
      await screen.findByText(order.orderNumber);
      clickFilter("All");
      const row = await rowOf(order.orderNumber);

      fireEvent.click(within(row).getByRole("button", { name: button }));

      const pending = within(row).getByRole("button", { name: "Updating…" }) as HTMLButtonElement;
      expect(pending.disabled).toBe(true);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(mock).toHaveBeenCalledWith(1);
      // Only the clicked button is pending.
      const otherButton = within(await rowOf(other.orderNumber)).getByRole("button", {
        name: button,
      }) as HTMLButtonElement;
      expect(otherButton.disabled).toBe(false);
      const fetchesBefore = mockedFetchOperatorOrders.mock.calls.length;

      resolveAction({ order: detail(order, to) });

      expect(await within(row).findByText(STATUS_TEXT[to], { exact: true })).toBeTruthy();
      const buttons = within(row).queryAllByRole("button").map((element) => element.textContent);
      expect(buttons).toEqual(next ? [next] : []);
      // The All filter still matches, so the row updates without a reload.
      expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(fetchesBefore);
    }
  );

  it.each(ACTIONS)(
    "TEST-86: $button reloads the list when the active filter no longer matches",
    async ({ button, from, to, mock }) => {
      const order = summary(1, from, "PAID");
      mockedFetchOperatorOrders.mockImplementation(async (status) => ({
        orders: status === from && mock.mock.calls.length > 0 ? [] : [order],
      }));
      mock.mockResolvedValue({ order: detail(order, to) });
      renderOperatorOrders();
      await screen.findByText(order.orderNumber);
      clickFilter(STATUS_TEXT[from]);
      const row = await rowOf(order.orderNumber);

      fireEvent.click(within(row).getByRole("button", { name: button }));

      expect(await screen.findByText("No orders to show.")).toBeTruthy();
      expect(mockedFetchOperatorOrders).toHaveBeenLastCalledWith(from);
      // Initial Pending load, the filter change and the reload.
      expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(3);
    }
  );

  it.each(ACTIONS)(
    "TEST-86: a 409 from $button shows the API message and reloads the list",
    async ({ button, from, to, mock }) => {
      const order = summary(1, from, "PAID");
      const message = `Cannot transition order from ${to} to ${to}`;
      mockedFetchOperatorOrders.mockResolvedValue({ orders: [order] });
      mock.mockRejectedValue(
        new ApiRequestError(409, "INVALID_TRANSITION", message, { from: to, to })
      );
      renderOperatorOrders();
      const row = await rowOf(order.orderNumber);

      fireEvent.click(within(row).getByRole("button", { name: button }));

      expect((await screen.findByRole("alert")).textContent).toBe(message);
      await screen.findByText(order.orderNumber);
      expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(2);
    }
  );

  it.each([
    ["a 500", new ApiRequestError(500, "INTERNAL_ERROR", "Something went wrong.")],
    ["a network error", new Error("Network failed")],
  ])("TEST-86: %s shows a generic alert and keeps the button", async (_label, error) => {
    const order = summary(1, "ACCEPTED", "PAID");
    mockedFetchOperatorOrders.mockResolvedValue({ orders: [order] });
    mockedStartOrder.mockRejectedValue(error);
    renderOperatorOrders();
    const row = await rowOf(order.orderNumber);

    fireEvent.click(within(row).getByRole("button", { name: "Start preparing" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not update this order. Please try again."
    );
    const button = within(row).getByRole("button", { name: "Start preparing" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(1);
  });
});

describe("OperatorOrders rejection (AC-102)", () => {
  const STATUSES: OrderStatus[] = [
    "PENDING",
    "ACCEPTED",
    "REJECTED",
    "CANCELLED",
    "PREPARING",
    "READY",
    "COMPLETED",
  ];
  const INVALID_MESSAGE = "Reason must be 5 to 200 characters.";
  const REASON = "Sold out of basil today";

  const summary = (id: number, status: OrderStatus): OperatorOrderSummary => ({
    ...SAMPLE_ORDERS[0],
    id,
    orderNumber: `CB-${String(id).padStart(6, "0")}`,
    status,
    paymentStatus: "UNPAID",
  });

  const rejectedDetail = (order: OperatorOrderSummary): Order => ({
    ...order,
    status: "REJECTED",
    pickupNote: null,
    items: [],
    history: [],
    updatedAt: "2026-11-28T06:00:00.000Z",
  });

  async function rowOf(orderNumber: string) {
    return (await screen.findByText(orderNumber)).closest("tr")!;
  }

  const queryDialog = () => screen.queryByRole("dialog");
  const reasonField = () =>
    within(screen.getByRole("dialog")).getByRole("textbox", { name: "Reason" }) as HTMLTextAreaElement;
  const dialogButton = (name: string) =>
    within(screen.getByRole("dialog")).getByRole("button", { name }) as HTMLButtonElement;
  const typeReason = (value: string) => fireEvent.change(reasonField(), { target: { value } });
  const submit = () => fireEvent.click(dialogButton("Reject order"));

  async function openDialog(orderNumber = "CB-000001") {
    fireEvent.click(within(await rowOf(orderNumber)).getByRole("button", { name: "Reject" }));
    return screen.getByRole("dialog", { name: `Reject order ${orderNumber}` });
  }

  beforeEach(() => {
    vi.resetAllMocks();
    mockedFetchOrderList([summary(1, "PENDING")]);
  });

  afterEach(() => {
    cleanup();
  });

  function mockedFetchOrderList(orders: OperatorOrderSummary[]) {
    mockedFetchOperatorOrders.mockResolvedValue({ orders });
  }

  it("TEST-102: Reject appears only on PENDING rows", async () => {
    const rows = STATUSES.map((status, index) => summary(index + 1, status));
    mockedFetchOrderList(rows);
    renderOperatorOrders();
    await screen.findByText("CB-000001");

    for (const order of rows) {
      const button = within(await rowOf(order.orderNumber)).queryByRole("button", { name: "Reject" });
      expect(button !== null, order.status).toBe(order.status === "PENDING");
    }
    expect(queryDialog()).toBeNull();
  });

  it("TEST-102: the dialog is named after the order, starts empty, and only one is open", async () => {
    mockedFetchOrderList([summary(1, "PENDING"), summary(2, "PENDING")]);
    renderOperatorOrders();

    const dialog = await openDialog("CB-000001");
    expect(reasonField().tagName).toBe("TEXTAREA");
    expect(reasonField().value).toBe("");
    expect(within(dialog).getByText("0/200")).toBeTruthy();
    expect(dialogButton("Reject order").disabled).toBe(false);
    expect(dialogButton("Back").disabled).toBe(false);

    typeReason("Typed for the first order");
    await openDialog("CB-000002");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(reasonField().value).toBe("");
  });

  it("TEST-102: the counter shows the trimmed length, turns into an error above 200 and does not cut text", async () => {
    renderOperatorOrders();
    const dialog = await openDialog();

    typeReason("  abcd  ");
    expect(within(dialog).getByText("4/200").className).not.toContain("text-danger");

    typeReason("a".repeat(200));
    expect(within(dialog).getByText("200/200").className).not.toContain("text-danger");

    typeReason("a".repeat(201));
    expect(within(dialog).getByText("201/200").className).toContain("text-danger");
    expect(reasonField().value).toHaveLength(201);
    expect(reasonField().getAttribute("maxlength")).toBeNull();
  });

  it.each([
    ["4 characters", "abcd"],
    ["201 characters", "a".repeat(201)],
    ["whitespace only", "        "],
  ])("TEST-102: %s shows a validation message and sends nothing", async (_label, value) => {
    renderOperatorOrders();
    const dialog = await openDialog();
    expect(within(dialog).queryByText(INVALID_MESSAGE)).toBeNull();

    typeReason(value);
    submit();

    expect(within(dialog).getByText(INVALID_MESSAGE)).toBeTruthy();
    expect(mockedRejectOrder).not.toHaveBeenCalled();

    typeReason(`${value}x`);
    expect(within(dialog).queryByText(INVALID_MESSAGE)).toBeNull();
  });

  it("TEST-102: Back closes the dialog, sends nothing and clears the reason", async () => {
    renderOperatorOrders();
    await openDialog();
    typeReason(REASON);

    fireEvent.click(dialogButton("Back"));

    expect(queryDialog()).toBeNull();
    expect(mockedRejectOrder).not.toHaveBeenCalled();
    await openDialog();
    expect(reasonField().value).toBe("");
  });

  it("TEST-102: a valid submit sends the trimmed reason, shows Rejecting…, then the row shows Rejected", async () => {
    let resolveReject!: (value: { order: Order }) => void;
    mockedRejectOrder.mockReturnValue(
      new Promise((resolve) => {
        resolveReject = resolve;
      })
    );
    renderOperatorOrders();
    await screen.findByText("CB-000001");
    fireEvent.click(within(screen.getByRole("group", { name: "Status filter" })).getByRole("button", { name: "All" }));
    await openDialog();
    const fetchesBefore = mockedFetchOperatorOrders.mock.calls.length;

    typeReason(`  ${REASON}  `);
    submit();

    expect(mockedRejectOrder).toHaveBeenCalledTimes(1);
    expect(mockedRejectOrder).toHaveBeenCalledWith(1, REASON);
    expect(dialogButton("Rejecting…").disabled).toBe(true);
    expect(dialogButton("Back").disabled).toBe(true);
    expect(reasonField().disabled).toBe(true);
    const row = await rowOf("CB-000001");
    expect((within(row).getByRole("button", { name: "Accept" }) as HTMLButtonElement).disabled).toBe(true);

    resolveReject({ order: rejectedDetail(summary(1, "PENDING")) });

    expect(await within(row).findByText("Rejected", { exact: true })).toBeTruthy();
    expect(queryDialog()).toBeNull();
    expect(within(row).queryAllByRole("button")).toHaveLength(0);
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(fetchesBefore);
  });

  it("TEST-102: under the Pending filter a successful reject reloads the list", async () => {
    mockedFetchOperatorOrders.mockImplementation(async () => ({
      orders: mockedRejectOrder.mock.calls.length > 0 ? [] : [summary(1, "PENDING")],
    }));
    mockedRejectOrder.mockResolvedValue({ order: rejectedDetail(summary(1, "PENDING")) });
    renderOperatorOrders();
    await openDialog();

    typeReason(REASON);
    submit();

    expect(await screen.findByText("No orders to show.")).toBeTruthy();
    expect(queryDialog()).toBeNull();
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(2);
    expect(mockedFetchOperatorOrders).toHaveBeenLastCalledWith("PENDING");
  });

  it("TEST-102: a 409 closes the dialog, shows an alert and reloads the list", async () => {
    mockedRejectOrder.mockRejectedValue(
      new ApiRequestError(409, "INVALID_TRANSITION", "Cannot transition order from ACCEPTED to REJECTED")
    );
    renderOperatorOrders();
    await openDialog();

    typeReason(REASON);
    submit();

    expect((await screen.findByRole("alert")).textContent).toBe("This order was already handled.");
    await screen.findByText("CB-000001");
    expect(queryDialog()).toBeNull();
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      "a 400 with a reason detail",
      new ApiRequestError(400, "VALIDATION_ERROR", "Invalid request body", [
        { field: "reason", message: "String must contain at least 5 character(s)" },
      ]),
      "String must contain at least 5 character(s)",
    ],
    [
      "a 400 without details",
      new ApiRequestError(400, "VALIDATION_ERROR", "Malformed request"),
      "Malformed request",
    ],
    [
      "a 403",
      new ApiRequestError(403, "FORBIDDEN", "You do not have permission to do this"),
      "You do not have permission to do this",
    ],
    [
      "a 500",
      new ApiRequestError(500, "INTERNAL_ERROR", "Something went wrong."),
      "Could not reject this order. Please try again.",
    ],
    ["a network error", new Error("Network failed"), "Could not reject this order. Please try again."],
  ])("TEST-102: %s keeps the dialog and the typed text", async (_label, error, message) => {
    mockedRejectOrder.mockRejectedValue(error);
    renderOperatorOrders();
    await openDialog();

    typeReason(REASON);
    submit();

    expect(await within(screen.getByRole("dialog")).findByText(message)).toBeTruthy();
    expect(reasonField().value).toBe(REASON);
    expect(dialogButton("Reject order").disabled).toBe(false);
    expect(mockedFetchOperatorOrders).toHaveBeenCalledTimes(1);
  });
});
