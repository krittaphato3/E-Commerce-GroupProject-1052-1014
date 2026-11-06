import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { roleHome } from "../auth/roles";
import type { Role } from "../api/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

/**
 * Navigation convenience only (SDS section 3.2): it never replaces server-side
 * authorization, and the API still rejects unauthorized requests.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-muted">Loading…</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <>{children}</>;
}
