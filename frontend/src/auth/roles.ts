import type { Role } from "../api/auth";

/** Landing page for each role after login (SDS section 3.1). */
export function roleHome(role: Role): string {
  return role === "OPERATOR" ? "/operator/orders" : "/menu";
}
