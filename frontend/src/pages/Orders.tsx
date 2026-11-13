import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOrders, type OrderSummary } from "../api/orders";
import { formatDateTime, formatThb, statusLabel } from "../lib/format";

export function Orders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchMyOrders()
      .then((result) => {
        if (!cancelled) setOrders(result.orders);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your orders. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return <p className="text-muted">Loading…</p>;
  }

  if (error) {
    return (
      <section>
        <div className="alert alert-danger" role="alert">
          {error}
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
      <h1 className="h3 mb-3">My orders</h1>

      {orders.length === 0 ? (
        <p className="text-muted">You have no orders yet.</p>
      ) : (
        <table className="table align-middle">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Placed</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link to={`/orders/${order.id}`}>{order.orderNumber}</Link>
                </td>
                <td>{formatDateTime(order.createdAt)}</td>
                <td>
                  <span className="badge bg-primary">{statusLabel(order.status)}</span>
                </td>
                <td className="text-end">{formatThb(order.totalSatang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
