import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../api/auth";

function renderRoleNav(role: Role) {
  switch (role) {
    case "CUSTOMER":
      return (
        <>
          <Link to="/menu" className="link-secondary text-decoration-none">
            Menu
          </Link>
          <Link to="/orders" className="link-secondary text-decoration-none">
            My orders
          </Link>
        </>
      );
    case "OPERATOR":
      return (
        <Link to="/operator/orders" className="link-secondary text-decoration-none">
          Orders
        </Link>
      );
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

function roleBadgeClass(role: Role): string {
  switch (role) {
    case "OPERATOR":
      return "bg-dark";
    case "CUSTOMER":
      return "bg-success";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="bg-white border-bottom">
      <div className="container py-3 d-flex flex-wrap align-items-center gap-3">
        <Link to="/" className="h4 text-primary text-decoration-none m-0">
          CampusBites
        </Link>

        {user && (
          <>
            <nav className="d-flex gap-3">{renderRoleNav(user.role)}</nav>

            <div className="ms-auto d-flex align-items-center gap-2">
              <span className="fw-semibold">{user.displayName}</span>
              <span className={`badge ${roleBadgeClass(user.role)}`}>{user.role}</span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleLogout}
                disabled={pending}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
