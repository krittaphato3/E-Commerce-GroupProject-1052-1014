import { type FormEvent, useEffect, useState } from "react";
import { ApiRequestError } from "../api/client";
import {
  createMenuItem,
  fetchMenu,
  updateMenuItem,
  type MenuItem,
  type UpdateMenuItemInput,
} from "../api/menu";
import { formatThb } from "../lib/format";

interface FormState {
  name: string;
  description: string;
  priceThb: string;
  stockQty: string;
  isAvailable: boolean;
}

interface ValidationDetail {
  field?: string;
  message: string;
}

function formatSatangInput(satang: number): string {
  const whole = Math.floor(satang / 100);
  const frac = String(satang % 100).padStart(2, "0");
  return `${whole}.${frac}`;
}

/** Parses THB text into integer satang without floating-point arithmetic. */
function parseThbToSatang(raw: string): number | null {
  const trimmed = raw.trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const whole = Number(match[1]);
  const frac = Number((match[2] ?? "").padEnd(2, "0"));
  return whole * 100 + frac;
}

function emptyForm(): FormState {
  return {
    name: "",
    description: "",
    priceThb: "",
    stockQty: "",
    isAvailable: true,
  };
}

function formFromItem(item: MenuItem): FormState {
  return {
    name: item.name,
    description: item.description,
    priceThb: formatSatangInput(item.priceSatang),
    stockQty: String(item.stockQty),
    isAvailable: item.isAvailable,
  };
}

function buildChangedFields(item: MenuItem, form: FormState): UpdateMenuItemInput {
  const patch: UpdateMenuItemInput = {};
  if (form.name.trim() !== item.name) {
    patch.name = form.name.trim();
  }
  if (form.description.trim() !== item.description) {
    patch.description = form.description.trim();
  }
  const parsedPrice = parseThbToSatang(form.priceThb);
  if (parsedPrice !== null && parsedPrice !== item.priceSatang) {
    patch.priceSatang = parsedPrice;
  }
  const trimmedStock = form.stockQty.trim();
  if (/^\d+$/.test(trimmedStock)) {
    const parsedStock = Number(trimmedStock);
    if (parsedStock !== item.stockQty) {
      patch.stockQty = parsedStock;
    }
  }
  if (form.isAvailable !== item.isAvailable) {
    patch.isAvailable = form.isAvailable;
  }
  return patch;
}

export function OperatorMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchMenu()
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load menu. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function openCreate() {
    setMode("create");
    setEditingItem(null);
    setForm(emptyForm());
    setFormError(null);
    setFieldErrors([]);
  }

  function openEdit(item: MenuItem) {
    setMode("edit");
    setEditingItem(item);
    setForm(formFromItem(item));
    setFormError(null);
    setFieldErrors([]);
  }

  function closeForm() {
    setMode("closed");
    setEditingItem(null);
    setFormError(null);
    setFieldErrors([]);
  }

  const editPatch =
    mode === "edit" && editingItem ? buildChangedFields(editingItem, form) : null;
  const hasEditChanges = editPatch !== null && Object.keys(editPatch).length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors([]);

    const priceSatang = parseThbToSatang(form.priceThb);
    const stockTrimmed = form.stockQty.trim();
    const stockQty = /^\d+$/.test(stockTrimmed) ? Number(stockTrimmed) : NaN;

    if (mode === "create") {
      if (priceSatang === null || Number.isNaN(stockQty)) {
        setFormError("Please enter a valid price and stock quantity.");
        return;
      }
      setSaving(true);
      try {
        const res = await createMenuItem({
          name: form.name.trim(),
          description: form.description.trim(),
          priceSatang,
          stockQty,
          isAvailable: form.isAvailable,
        });
        setItems((prev) => [...prev, res.item]);
        closeForm();
      } catch (err) {
        handleFormError(err);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (mode === "edit" && editingItem && editPatch && Object.keys(editPatch).length > 0) {
      setSaving(true);
      try {
        const res = await updateMenuItem(editingItem.id, editPatch);
        setItems((prev) => prev.map((it) => (it.id === res.item.id ? res.item : it)));
        closeForm();
      } catch (err) {
        handleFormError(err);
      } finally {
        setSaving(false);
      }
    }
  }

  function handleFormError(err: unknown) {
    if (err instanceof ApiRequestError) {
      if (err.status === 404) {
        setFormError(err.message);
        setReloadKey((k) => k + 1);
        return;
      }
      if (Array.isArray(err.details) && err.details.length > 0) {
        const msgs = (err.details as ValidationDetail[])
          .map((d) => d.message)
          .filter(Boolean);
        setFieldErrors(msgs);
        setFormError(err.message);
        return;
      }
      setFormError(err.message);
      return;
    }
    setFormError("Could not save menu item. Please try again.");
  }

  async function handleToggleAvailability(item: MenuItem) {
    setTogglingId(item.id);
    setActionError(null);
    try {
      const res = await updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      setItems((prev) => prev.map((it) => (it.id === res.item.id ? res.item : it)));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setActionError(err.message);
        setReloadKey((k) => k + 1);
      } else {
        setActionError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not update item availability. Please try again."
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading menu…</p>;
  }

  if (loadError) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between">
        <span>{loadError}</span>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 m-0">Menu management</h1>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          New item
        </button>
      </div>

      {actionError && <div className="alert alert-danger">{actionError}</div>}

      {mode !== "closed" && (
        <form onSubmit={handleSubmit} className="card p-3 mb-4">
          <h2 className="h5 mb-3">{mode === "create" ? "New item" : "Edit item"}</h2>

          {formError && (
            <div className="alert alert-danger">
              <div>{formError}</div>
              {fieldErrors.length > 0 && (
                <ul className="mb-0 mt-1">
                  {fieldErrors.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mb-2">
            <label htmlFor="menu-name" className="form-label">
              Name
            </label>
            <input
              id="menu-name"
              type="text"
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="mb-2">
            <label htmlFor="menu-description" className="form-label">
              Description
            </label>
            <input
              id="menu-description"
              type="text"
              className="form-control"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="row g-2 mb-2">
            <div className="col-sm-6">
              <label htmlFor="menu-price" className="form-label">
                Price (THB)
              </label>
              <input
                id="menu-price"
                type="text"
                className="form-control"
                value={form.priceThb}
                onChange={(e) => setForm({ ...form, priceThb: e.target.value })}
              />
            </div>
            <div className="col-sm-6">
              <label htmlFor="menu-stock" className="form-label">
                Stock
              </label>
              <input
                id="menu-stock"
                type="text"
                className="form-control"
                value={form.stockQty}
                onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
              />
            </div>
          </div>

          <div className="form-check mb-3">
            <input
              id="menu-available"
              type="checkbox"
              className="form-check-input"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            />
            <label htmlFor="menu-available" className="form-check-label">
              Enabled
            </label>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || (mode === "edit" && !hasEditChanges)}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-muted">No menu items yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="fw-semibold">{item.name}</td>
                  <td>{item.description}</td>
                  <td>{formatThb(item.priceSatang)}</td>
                  <td>{item.stockQty}</td>
                  <td>
                    <span
                      className={`badge ${item.isAvailable ? "bg-success" : "bg-secondary"}`}
                    >
                      {item.isAvailable ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="text-end d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => openEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={togglingId === item.id}
                      onClick={() => handleToggleAvailability(item)}
                    >
                      {item.isAvailable ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
