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

export interface CreateMenuItemInput {
  name: string;
  description: string;
  priceSatang: number;
  stockQty: number;
  isAvailable?: boolean;
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  priceSatang?: number;
  stockQty?: number;
  isAvailable?: boolean;
}

export function fetchMenu(): Promise<{ items: MenuItem[] }> {
  return apiRequest<{ items: MenuItem[] }>("/api/menu");
}

export function createMenuItem(body: CreateMenuItemInput): Promise<{ item: MenuItem }> {
  return apiRequest<{ item: MenuItem }>("/api/menu-items", {
    method: "POST",
    body,
  });
}

export function updateMenuItem(
  id: number,
  body: UpdateMenuItemInput
): Promise<{ item: MenuItem }> {
  return apiRequest<{ item: MenuItem }>(`/api/menu-items/${id}`, {
    method: "PATCH",
    body,
  });
}
