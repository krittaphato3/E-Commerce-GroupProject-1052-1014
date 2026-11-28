import { apiRequest } from "./client";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "PREPARING"
  | "READY"
  | "COMPLETED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export interface OrderLine {
  menuItemId: number;
  itemName: string;
  unitPriceSatang: number;
  quantity: number;
  lineTotalSatang: number;
}

export interface OrderHistoryEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actorRole: "CUSTOMER" | "OPERATOR";
  createdAt: string;
  /** The rejection reason; null on every other entry. */
  note: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalSatang: number;
  pickupNote: string | null;
  items: OrderLine[];
  history: OrderHistoryEntry[];
  customer?: { id: number; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalSatang: number;
  itemCount: number;
  createdAt: string;
}

export interface OperatorOrderSummary extends OrderSummary {
  customer: { id: number; displayName: string };
}

export interface CreateOrderInput {
  items: Array<{ menuItemId: number; quantity: number }>;
  pickupNote?: string;
}

/** The server owns pricing and totals; this body carries quantities only (BR-03). */
export function createOrder(input: CreateOrderInput): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>("/api/orders", { method: "POST", body: input });
}

export function fetchOrder(id: number): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}`);
}

export function fetchMyOrders(): Promise<{ orders: OrderSummary[] }> {
  return apiRequest<{ orders: OrderSummary[] }>("/api/orders/mine");
}

export function fetchOperatorOrders(
  status?: OrderStatus
): Promise<{ orders: OperatorOrderSummary[] }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<{ orders: OperatorOrderSummary[] }>(`/api/orders${query}`);
}

export function acceptOrder(id: number): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}/accept`, { method: "POST" });
}

export function rejectOrder(id: number, reason: string): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}/reject`, {
    method: "POST",
    body: { reason },
  });
}

export function cancelOrder(id: number): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}/cancel`, { method: "POST" });
}

/** Simulated payment: the server only compares the amount with the stored total (BR-11). */
export function payOrder(id: number, amountSatang: number): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}/pay`, {
    method: "POST",
    body: { amountSatang },
  });
}


/** Fulfilment steps (FR-12, DEC-37): no request body. */
export function startOrder(id: number): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}/start`, { method: "POST" });
}

export function markOrderReady(id: number): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}/ready`, { method: "POST" });
}

export function completeOrder(id: number): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(`/api/orders/${id}/complete`, { method: "POST" });
}
