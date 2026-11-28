import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptOrder,
  completeOrder,
  fetchOperatorOrders,
  markOrderReady,
  rejectOrder,
  startOrder,
  type OperatorOrderSummary,
  type OrderStatus,
} from "../api/orders";
import { ApiRequestError } from "../api/client";
import { RejectOrderDialog } from "../components/RejectOrderDialog";
import { formatDateTime, formatThb, paymentStatusLabel, statusLabel } from "../lib/format";

const FILTER_OPTIONS: Array<{ label: string; value: OrderStatus | "" }> = [
  { label: "Pending", value: "PENDING" },
  { label: "All", value: "" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Rejected", value: "REJECTED" },
];

interface FulfilmentAction {
  label: string;
  next: OrderStatus;
  run: (id: number) => Promise<unknown>;
}

/**
 * The one fulfilment step a row offers, or null. This only decides which button is
 * shown; the API enforces the transition and payment rules (BR-06, BR-09).
 */
function fulfilmentAction(order: OperatorOrderSummary): FulfilmentAction | null {
  switch (order.status) {
    case "ACCEPTED":
      return order.paymentStatus === "PAID"
        ? { label: "Start preparing", next: "PREPARING", run: (id) => startOrder(id) }
        : null;
    case "PREPARING":
      return { label: "Mark ready", next: "READY", run: (id) => markOrderReady(id) };
    case "READY":
      return { label: "Complete", next: "COMPLETED", run: (id) => completeOrder(id) };
    default:
      return null;
  }
}

/** What the reject dialog shows for a failed request other than 409. */
function rejectErrorMessage(err: unknown): string {
  if (!(err instanceof ApiRequestError) || err.status >= 500) {
    return "Could not reject this order. Please try again.";
  }

  if (err.status === 400 && Array.isArray(err.details)) {
    const detail = (err.details as Array<{ field?: string; message?: string }>).find(
      (entry) => entry.field === "reason"
    );
    if (detail?.message) return detail.message;
  }

  return err.message;
}

export function OperatorOrders() {
  const [orders, setOrders] = useState<OperatorOrderSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("PENDING");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [updatingIds, setUpdatingIds] = useState<ReadonlySet<number>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<OperatorOrderSummary | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;

  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    fetchOperatorOrders(statusFilter === "" ? undefined : statusFilter)
      .then((result) => {
        if (!cancelled) setOrders(result.orders);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load incoming orders. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, reloadKey]);

  async function handleAccept(orderId: number) {
    const filterAtClick = statusFilterRef.current;
    setAcceptingId(orderId);
    setActionError(null);

    try {
      await acceptOrder(orderId);
      const currentFilter = statusFilterRef.current;
      const orderInList = ordersRef.current.some((o) => o.id === orderId);

      if (
        currentFilter !== filterAtClick ||
        (!orderInList && (currentFilter === "" || currentFilter === "ACCEPTED"))
      ) {
        setReloadKey((k) => k + 1);
      } else {
        // In-place row update per Decision 2 when active filter is unchanged
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId ? { ...order, status: "ACCEPTED" } : order
          )
        );
      }
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 409 || err.code === "INVALID_TRANSITION")) {
        setActionError("This order was already handled.");
        setReloadKey((k) => k + 1);
      } else {
        setActionError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not accept order. Please try again."
        );
      }
    } finally {
      setAcceptingId(null);
    }
  }

  /** Shows an order's new status after an action that moves it out of its old one. */
  function showNewStatus(orderId: number, next: OrderStatus, filterAtClick: OrderStatus | "") {
    // Only the unchanged "All" view still matches the new status and can be updated in place.
    const canUpdateInPlace =
      statusFilterRef.current === "" &&
      filterAtClick === "" &&
      ordersRef.current.some((o) => o.id === orderId);

    if (canUpdateInPlace) {
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: next } : order))
      );
    } else {
      setReloadKey((k) => k + 1);
    }
  }

  async function handleReject(orderId: number, reason: string) {
    const filterAtClick = statusFilterRef.current;
    setRejectingId(orderId);
    setRejectError(null);
    setActionError(null);

    try {
      await rejectOrder(orderId, reason);
      setRejectTarget(null);
      showNewStatus(orderId, "REJECTED", filterAtClick);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setRejectTarget(null);
        setActionError("This order was already handled.");
        setReloadKey((k) => k + 1);
      } else {
        setRejectError(rejectErrorMessage(err));
      }
    } finally {
      setRejectingId(null);
    }
  }

  async function handleFulfilment(orderId: number, action: FulfilmentAction) {
    const filterAtClick = statusFilterRef.current;
    setUpdatingIds((current) => new Set(current).add(orderId));
    setActionError(null);

    try {
      await action.run(orderId);
      showNewStatus(orderId, action.next, filterAtClick);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setActionError(err.message);
        setReloadKey((k) => k + 1);
      } else {
        setActionError(
          err instanceof ApiRequestError && err.status < 500
            ? err.message
            : "Could not update this order. Please try again."
        );
      }
    } finally {
      setUpdatingIds((current) => {
        const remaining = new Set(current);
        remaining.delete(orderId);
        return remaining;
      });
    }
  }

  function renderAction(order: OperatorOrderSummary) {
    if (order.status === "PENDING") {
      return (
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={() => handleAccept(order.id)}
            disabled={acceptingId === order.id || rejectingId === order.id}
          >
            {acceptingId === order.id ? "Accepting…" : "Accept"}
          </button>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => {
              setRejectError(null);
              setRejectTarget(order);
            }}
            disabled={acceptingId === order.id || rejectingId !== null}
          >
            Reject
          </button>
        </div>
      );
    }

    if (order.status === "ACCEPTED" && order.paymentStatus === "UNPAID") {
      return <span className="text-muted small">Awaiting payment</span>;
    }

    const action = fulfilmentAction(order);
    if (!action) return null;

    const updating = updatingIds.has(order.id);
    return (
      <button
        type="button"
        className="btn btn-success btn-sm"
        onClick={() => handleFulfilment(order.id, action)}
        disabled={updating}
      >
        {updating ? "Updating…" : action.label}
      </button>
    );
  }

  return (
    <section>
      <h1 className="h3 mb-3">Incoming orders</h1>

      <div className="btn-group flex-wrap mb-3" role="group" aria-label="Status filter">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`btn btn-sm ${
              statusFilter === option.value ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setStatusFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="alert alert-warning mb-3" role="alert">
          {actionError}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading orders…</p>
      ) : loadError ? (
        <div>
          <div className="alert alert-danger" role="alert">
            {loadError}
          </div>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted">No orders to show.</p>
      ) : (
        <table className="table align-middle">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Items</th>
              <th scope="col" className="text-end">
                Total
              </th>
              <th scope="col">Status</th>
              <th scope="col">Payment</th>
              <th scope="col">Placed</th>
              <th scope="col" className="text-end">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link to={`/orders/${order.id}`}>{order.orderNumber}</Link>
                </td>
                <td>{order.customer.displayName}</td>
                <td>{order.itemCount}</td>
                <td className="text-end">{formatThb(order.totalSatang)}</td>
                <td>
                  <span className="badge bg-primary">{statusLabel(order.status)}</span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      order.paymentStatus === "PAID" ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {paymentStatusLabel(order.paymentStatus)}
                  </span>
                </td>
                <td>{formatDateTime(order.createdAt)}</td>
                <td className="text-end">{renderAction(order)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rejectTarget && (
        <RejectOrderDialog
          // A different order gets a fresh, empty dialog.
          key={rejectTarget.id}
          orderNumber={rejectTarget.orderNumber}
          pending={rejectingId === rejectTarget.id}
          error={rejectError}
          onSubmit={(reason) => handleReject(rejectTarget.id, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </section>
  );
}
