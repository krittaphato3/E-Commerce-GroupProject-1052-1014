import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiRequestError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { roleHome } from "../auth/roles";

function loginErrors(error: unknown): string[] {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return ["Invalid email or password."];
    }

    if (Array.isArray(error.details)) {
      const fieldMessages = error.details.flatMap((detail) => {
        if (typeof detail !== "object" || detail === null) return [];
        const { field, message } = detail as { field?: unknown; message?: unknown };
        return typeof field === "string" && typeof message === "string"
          ? [`${field}: ${message}`]
          : [];
      });

      if (fieldMessages.length > 0) {
        return fieldMessages;
      }
    }

    return [error.message];
  }

  return ["Something went wrong. Please try again."];
}

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setPending(true);

    try {
      const loggedIn = await login(email, password);
      navigate(roleHome(loggedIn.role), { replace: true });
    } catch (error) {
      setErrors(loginErrors(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h1 className="h4 mb-3">Log in</h1>
            <p className="text-muted">Pre-order your meal from the campus canteen.</p>

            {errors.length > 0 && (
              <div className="alert alert-danger" role="alert">
                {errors.map((message) => (
                  <div key={message}>{message}</div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="form-control"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="form-control"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={pending}>
                {pending ? "Logging in…" : "Log in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
