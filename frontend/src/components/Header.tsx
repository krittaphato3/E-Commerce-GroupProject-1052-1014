import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
            <nav className="d-flex gap-3">
              {user.role === "CUSTOMER" ? (
                <>
                  <Link to="/menu" className="link-secondary text-decoration-none">
                    Menu
                  </Link>
                  <Link to="/orders" className="link-secondary text-decoration-none">
                    My orders
                  </Link>
                </>
              ) : (
                <Link to="/operator/orders" className="link-secondary text-decoration-none">
                  Orders
                </Link>
              )}
            </nav>

            <div className="ms-auto d-flex align-items-center gap-2">
              <span className="fw-semibold">{user.displayName}</span>
              <span
                className={`badge ${user.role === "OPERATOR" ? "bg-dark" : "bg-success"}`}
              >
                {user.role}
              </span>
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
