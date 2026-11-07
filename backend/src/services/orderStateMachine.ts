import type { OrderStatus } from "@prisma/client";

export function canTransition(_from: OrderStatus, _to: OrderStatus): boolean {
  return false;
}

export function assertTransition(_from: OrderStatus, _to: OrderStatus): void {
  // Stub for red test phase
}
