import type { Role } from "../api/auth";

/** Landing page for each role after login (SDS section 3.1). */
export function roleHome(role: Role): string {
  switch (role) {
    case "CUSTOMER":
      return "/menu";
    case "OPERATOR":
      return "/operator/orders";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
