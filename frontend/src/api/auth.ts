import { apiRequest } from "./client";

export type Role = "CUSTOMER" | "OPERATOR";

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: Role;
}

export function login(email: string, password: string): Promise<{ user: User }> {
  return apiRequest<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/api/auth/logout", { method: "POST" });
}

export function fetchCurrentUser(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>("/api/auth/me");
}
