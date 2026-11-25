import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Menu } from "./pages/Menu";
import { OperatorOrders } from "./pages/OperatorOrders";
import { OrderDetail } from "./pages/OrderDetail";
import { Orders } from "./pages/Orders";

export function formatShortVersion(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) return "dev";
  return /^[0-9a-f]{12,40}$/i.test(trimmed) ? trimmed.slice(0, 7) : trimmed;
}

export function AppShell() {
  const buildSha = import.meta.env.VITE_GIT_SHA?.trim();
  const [version, setVersion] = useState<string>(() => formatShortVersion(buildSha));

  useEffect(() => {
    if (buildSha) return;
    let cancelled = false;

    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { version?: unknown } | null) => {
        if (!cancelled && typeof payload?.version === "string" && payload.version.trim()) {
          setVersion(formatShortVersion(payload.version));
        }
      })
      .catch(() => {
        // Keep fallback version label when the health probe cannot be reached.
      });

    return () => {
      cancelled = true;
    };
  }, [buildSha]);

  return (
    <>
      <Header />
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/menu" element={<Menu />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute roles={["CUSTOMER"]}>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/orders"
            element={
              <ProtectedRoute roles={["OPERATOR"]}>
                <OperatorOrders />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-top py-3 mt-4 text-center text-muted small">
        <div className="container">Version: {version}</div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
