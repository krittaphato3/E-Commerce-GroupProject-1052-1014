import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchOrder, type Order } from "../api/orders";
import { formatDateTime, formatThb, paymentStatusLabel, statusLabel } from "../lib/format";

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
      .catch(() => {
        if (!cancelled) setError("Could not load this order. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

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
        <Link to="/orders" className="ms-auto link-secondary">
          My orders
        </Link>
      </div>

      <p className="text-muted">Placed on {formatDateTime(order.createdAt)}</p>

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
