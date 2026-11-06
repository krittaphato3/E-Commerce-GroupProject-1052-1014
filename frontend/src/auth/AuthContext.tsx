import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type User,
} from "../api/auth";
import { ApiRequestError } from "../api/client";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Classifies an error from the current-user check: only 401 is treated as unauthenticated.
 * Other errors (network, 500) are surfaced so an existing session is not silently dropped.
 */
export function classifyAuthError(err: unknown): { user: null; error: Error | null } {
  if (err instanceof ApiRequestError && err.status === 401) {
    return { user: null, error: null };
  }
  return {
    user: null,
    error: err instanceof Error ? err : new Error(String(err)),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((result) => {
        if (!cancelled) {
          setUser(result.user);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const resolution = classifyAuthError(err);
        setUser(resolution.user);
        setError(resolution.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    setUser(result.user);
    setError(null);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, logout }),
    [user, loading, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
