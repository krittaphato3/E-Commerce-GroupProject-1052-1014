export interface AvailabilityItem {
  isAvailable: boolean;
  stockQty: number;
}

/**
 * BR-02: one shared availability rule for F-02 (the menu flag) and F-03 (order lines).
 * An item is orderable only when it is enabled and its stock covers the requested quantity.
 */
export function isOrderable(item: AvailabilityItem, quantity: number): boolean {
  return item.isAvailable === true && quantity > 0 && item.stockQty >= quantity;
}
