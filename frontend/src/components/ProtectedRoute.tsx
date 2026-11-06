import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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
  const { user, loading, error } = useAuth();

  if (loading) {
    return <p className="text-muted">Loading…</p>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Failed to verify authentication status. Please refresh or try again later.
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="alert alert-warning" role="alert">
        403 Forbidden: You have no access to this page.
      </div>
    );
  }

  return <>{children}</>;
}
