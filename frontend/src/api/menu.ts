import { apiRequest } from "./client";

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  priceSatang: number;
  stockQty: number;
  isAvailable: boolean;
  available: boolean;
}

export function fetchMenu(): Promise<{ items: MenuItem[] }> {
  return apiRequest<{ items: MenuItem[] }>("/api/menu");
}
