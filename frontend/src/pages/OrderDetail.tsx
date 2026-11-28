import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiRequestError } from "../api/client";
import { cancelOrder, fetchOrder, payOrder, type Order } from "../api/orders";
import { useAuth } from "../auth/AuthContext";
import { formatDateTime, formatThb, paymentStatusLabel, statusLabel } from "../lib/format";

export function OrderDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [confirmingPay, setConfirmingPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // A different order starts clean. A reload of the same order keeps the action alerts.
  useEffect(() => {
    setConfirmingCancel(false);
    setCancelError(null);
    setConfirmingPay(false);
    setPayError(null);
  }, [id]);

  useEffect(() => {
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId < 1) {
      setError("This order does not exist.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchOrder(orderId)
      .then((result) => {
        if (!cancelled) setOrder(result.order);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError && err.status < 500
              ? err.message
              : "Could not load this order. Please try again."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  async function handleCancel(orderId: number) {
    setCancelling(true);
    setCancelError(null);

    try {
      const result = await cancelOrder(orderId);
      setOrder(result.order);
      setConfirmingCancel(false);
    } catch (err) {
      setConfirmingCancel(false);
      if (err instanceof ApiRequestError && err.status === 409) {
        setCancelError("This order can no longer be cancelled.");
        setReloadKey((key) => key + 1);
      } else {
        setCancelError(
          err instanceof ApiRequestError && err.status < 500
            ? err.message
            : "Could not cancel this order. Please try again."
        );
      }
    } finally {
      setCancelling(false);
    }
  }

  async function handlePay(orderId: number, amountSatang: number) {
    setPaying(true);
    setPayError(null);

    try {
      const result = await payOrder(orderId, amountSatang);
      setOrder(result.order);
      setConfirmingPay(false);
    } catch (err) {
      setConfirmingPay(false);
      if (err instanceof ApiRequestError && (err.status === 409 || err.status === 400)) {
        setPayError(err.message);
        setReloadKey((key) => key + 1);
      } else {
        setPayError("Could not pay for this order. Please try again.");
      }
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading order…</p>;
  }

  if (error || !order) {
    return (
      <section>
        <div className="alert alert-danger" role="alert">
          {error ?? "This order does not exist."}
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => setReloadKey((key) => key + 1)}
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0">
          Order <span data-testid="order-number">{order.orderNumber}</span>
        </h1>
        <span className="badge bg-primary">{statusLabel(order.status)}</span>
        <span className="badge bg-secondary">{paymentStatusLabel(order.paymentStatus)}</span>
        {user?.role === "OPERATOR" ? (
          <Link to="/operator/orders" className="ms-auto link-secondary">
            Incoming orders
          </Link>
        ) : (
          <Link to="/orders" className="ms-auto link-secondary">
            My orders
          </Link>
        )}
      </div>

      {order.customer && (
        <p className="mb-1">
          <span className="fw-semibold">Customer:</span> {order.customer.displayName}
        </p>
      )}

      <p className="text-muted">Placed on {formatDateTime(order.createdAt)}</p>

      {cancelError && (
        <div className="alert alert-danger" role="alert">
          {cancelError}
        </div>
      )}

      {user?.role === "CUSTOMER" && order.status === "PENDING" && (
        <div className="mb-3">
          {confirmingCancel ? (
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="fw-semibold">Cancel this order?</span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={cancelling}
                onClick={() => handleCancel(order.id)}
              >
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={cancelling}
                onClick={() => setConfirmingCancel(false)}
              >
                Keep order
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                setCancelError(null);
                setConfirmingCancel(true);
              }}
            >
              Cancel order
            </button>
          )}
        </div>
      )}

      {payError && (
        <div className="alert alert-danger" role="alert">
          {payError}
        </div>
      )}

      {user?.role === "CUSTOMER" &&
        order.status === "PENDING" &&
        order.paymentStatus === "UNPAID" && (
          <p className="text-muted">You can pay after the shop accepts this order.</p>
        )}

      {user?.role === "CUSTOMER" &&
        order.status === "ACCEPTED" &&
        order.paymentStatus === "UNPAID" && (
          <div className="mb-3">
            {confirmingPay ? (
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="fw-semibold">
                  Pay {formatThb(order.totalSatang)} (simulated)?
                </span>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  disabled={paying}
                  onClick={() => handlePay(order.id, order.totalSatang)}
                >
                  {paying ? "Paying…" : "Confirm payment"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={paying}
                  onClick={() => setConfirmingPay(false)}
                >
                  Back
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => {
                  setPayError(null);
                  setConfirmingPay(true);
                }}
              >
                Pay
              </button>
            )}
          </div>
        )}

      <table className="table align-middle">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="text-end">
              Unit price
            </th>
            <th scope="col" className="text-end">
              Qty
            </th>
            <th scope="col" className="text-end">
              Line total
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((line) => (
            <tr key={line.menuItemId}>
              <td>{line.itemName}</td>
              <td className="text-end">{formatThb(line.unitPriceSatang)}</td>
              <td className="text-end">{line.quantity}</td>
              <td className="text-end">{formatThb(line.lineTotalSatang)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3} className="text-end">
              Total
            </th>
            <th className="text-end">{formatThb(order.totalSatang)}</th>
          </tr>
        </tfoot>
      </table>

      {order.pickupNote && (
        <p>
          <span className="fw-semibold">Pickup note:</span> {order.pickupNote}
        </p>
      )}

      <h2 className="h5 mt-4">History</h2>
      <ol className="list-group list-group-numbered">
        {order.history.map((entry, index) => (
          <li className="list-group-item" key={`${entry.toStatus}-${index}`}>
            {entry.fromStatus === null
              ? "Order placed"
              : `${statusLabel(entry.fromStatus)} → ${statusLabel(entry.toStatus)}`}
            <span className="text-muted small ms-2">
              {entry.actorRole} · {formatDateTime(entry.createdAt)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
