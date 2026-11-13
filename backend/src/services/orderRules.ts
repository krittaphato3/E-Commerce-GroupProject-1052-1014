export interface PricedLine {
  unitPriceSatang: number;
  quantity: number;
}

/** BR-03: the server computes the total from the snapshotted unit prices. */
export function calculateOrderTotal(lines: PricedLine[]): number {
  return lines.reduce((total, line) => total + line.unitPriceSatang * line.quantity, 0);
}

/** BR-14: order number is "CB-" plus the id padded to six digits. */
export function formatOrderNumber(id: number): string {
  return `CB-${String(id).padStart(6, "0")}`;
}
