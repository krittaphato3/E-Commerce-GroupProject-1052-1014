import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiRequestError } from "../api/client";
import { fetchMenu, type MenuItem } from "../api/menu";
import { createOrder } from "../api/orders";
import { useAuth } from "../auth/AuthContext";
import { formatThb } from "../lib/format";

const MAX_LINE_QUANTITY = 10;
const LOW_STOCK_THRESHOLD = 10;

interface CartLine {
  menuItemId: number;
  name: string;
  unitPriceSatang: number;
  quantity: number;
}

export function Menu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickupNote, setPickupNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    fetchMenu()
      .then((result) => {
        if (!cancelled) setItems(result.items);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load the menu. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const estimatedTotal = useMemo(
    () => cart.reduce((total, line) => total + line.unitPriceSatang * line.quantity, 0),
    [cart]
  );

  const quantityFor = useCallback(
    (menuItemId: number) => quantities[menuItemId] ?? 1,
    [quantities]
  );

  const changeQuantity = useCallback((menuItemId: number, delta: number) => {
    setQuantities((current) => {
      const next = Math.min(
        MAX_LINE_QUANTITY,
        Math.max(1, (current[menuItemId] ?? 1) + delta)
      );
      return { ...current, [menuItemId]: next };
    });
  }, []);

  function addToCart(item: MenuItem) {
    const quantity = quantityFor(item.id);

    setCart((current) => {
      const existing = current.find((line) => line.menuItemId === item.id);

      if (existing) {
        return current.map((line) =>
          line.menuItemId === item.id
            ? { ...line, quantity: Math.min(MAX_LINE_QUANTITY, line.quantity + quantity) }
            : line
        );
      }

      return [
        ...current,
        {
          menuItemId: item.id,
          name: item.name,
          unitPriceSatang: item.priceSatang,
          quantity,
        },
      ];
    });
  }

  function changeCartQuantity(menuItemId: number, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.menuItemId === menuItemId ? { ...line, quantity: line.quantity + delta } : line
        )
        .filter((line) => line.quantity > 0)
        .map((line) => ({ ...line, quantity: Math.min(MAX_LINE_QUANTITY, line.quantity) }))
    );
  }

  function removeLine(menuItemId: number) {
    setCart((current) => current.filter((line) => line.menuItemId !== menuItemId));
  }

  async function handlePlaceOrder() {
    setOrderError(null);
    setPlacing(true);

    try {
      const result = await createOrder({
        items: cart.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
        })),
        pickupNote: pickupNote.trim() === "" ? undefined : pickupNote.trim(),
      });

      setCart([]);
      setPickupNote("");
      navigate(`/orders/${result.order.id}`);
    } catch (error) {
      // AC-30: keep the cart so the customer can fix it; never navigate away on failure.
      setOrderError(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <section>
        <h1 className="h3 mb-3">Menu</h1>
        <p className="text-muted">Loading menu…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section>
        <h1 className="h3 mb-3">Menu</h1>
        <div className="alert alert-danger" role="alert">
          {loadError}
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

  if (items.length === 0) {
    return (
      <section>
        <h1 className="h3 mb-3">Menu</h1>
        <p className="text-muted">The menu is empty.</p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="h3 mb-3">Menu</h1>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="row row-cols-1 row-cols-md-2 g-3">
            {items.map((item) => {
              const quantity = quantityFor(item.id);

              return (
                <div className="col" key={item.id}>
                  <article className="card h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h2 className="h6 card-title">{item.name}</h2>
                      <p className="card-text small text-muted flex-grow-1">
                        {item.description}
                      </p>
                      <p className="fw-bold mb-1">{formatThb(item.priceSatang)}</p>

                      {item.available && item.stockQty <= LOW_STOCK_THRESHOLD && (
                        <p className="small text-warning mb-1">{item.stockQty} left</p>
                      )}

                      {!item.available && (
                        <span className="badge bg-secondary align-self-start mb-2">
                          Sold out
                        </span>
                      )}

                      <div className="d-flex align-items-center gap-2 mt-auto">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          aria-label={`Decrease menu quantity for ${item.name}`}
                          onClick={() => changeQuantity(item.id, -1)}
                          disabled={!item.available || quantity <= 1}
                        >
                          −
                        </button>
                        <span className="fw-semibold">{quantity}</span>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          aria-label={`Increase menu quantity for ${item.name}`}
                          onClick={() => changeQuantity(item.id, 1)}
                          disabled={!item.available || quantity >= MAX_LINE_QUANTITY}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm ms-auto"
                          aria-label={`Add ${item.name} to cart`}
                          onClick={() => addToCart(item)}
                          disabled={!item.available}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-lg-5">
          <section aria-label="Cart" className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Your cart</h2>

              {cart.length === 0 ? (
                <p className="text-muted">Your cart is empty.</p>
              ) : (
                <ul className="list-unstyled mb-3">
                  {cart.map((line) => (
                    <li key={line.menuItemId} className="border-bottom py-2">
                      <div className="d-flex justify-content-between">
                        <span className="fw-semibold">{line.name}</span>
                        <span>{formatThb(line.unitPriceSatang * line.quantity)}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          aria-label={`Decrease quantity in cart for ${line.name}`}
                          onClick={() => changeCartQuantity(line.menuItemId, -1)}
                        >
                          −
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          aria-label={`Increase quantity in cart for ${line.name}`}
                          onClick={() => changeCartQuantity(line.menuItemId, 1)}
                          disabled={line.quantity >= MAX_LINE_QUANTITY}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-danger ms-auto"
                          onClick={() => removeLine(line.menuItemId)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <p className="fw-bold mb-3">Estimated total: {formatThb(estimatedTotal)}</p>

              <div className="mb-3">
                <label className="form-label" htmlFor="pickupNote">
                  Pickup note
                </label>
                <input
                  id="pickupNote"
                  className="form-control"
                  type="text"
                  maxLength={200}
                  value={pickupNote}
                  onChange={(event) => setPickupNote(event.target.value)}
                  placeholder="For example: Pickup at 12:30"
                />
                <div className="form-text text-end">{pickupNote.length}/200</div>
              </div>

              {orderError && (
                <div className="alert alert-danger" role="alert">
                  {orderError}
                </div>
              )}

              {!user && (
                <Link to="/login" className="btn btn-primary w-100">
                  Log in to order
                </Link>
              )}

              {user && user.role !== "CUSTOMER" && (
                <p className="text-muted mb-0">Only customers can place orders.</p>
              )}

              {user && user.role === "CUSTOMER" && (
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0 || placing}
                >
                  {placing ? "Placing order…" : "Place order"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
