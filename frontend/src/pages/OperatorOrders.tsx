import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptOrder,
  fetchOperatorOrders,
  type OperatorOrderSummary,
  type OrderStatus,
} from "../api/orders";
import { ApiRequestError } from "../api/client";
import { formatDateTime, formatThb, statusLabel } from "../lib/format";

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

export function OperatorOrders() {
  const [orders, setOrders] = useState<OperatorOrderSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("PENDING");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
    setAcceptingId(orderId);
    setActionError(null);

    try {
      await acceptOrder(orderId);
      // In-place row update per Decision 2
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: "ACCEPTED" } : order
        )
      );
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setActionError(err.message);
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
                <td>{formatDateTime(order.createdAt)}</td>
                <td className="text-end">
                  {order.status === "PENDING" && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => handleAccept(order.id)}
                      disabled={acceptingId === order.id}
                    >
                      {acceptingId === order.id ? "Accepting…" : "Accept"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
