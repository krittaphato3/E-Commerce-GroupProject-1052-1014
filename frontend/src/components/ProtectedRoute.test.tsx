import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import * as AuthContextModule from "../auth/AuthContext";
import type { User } from "../api/auth";

describe("ProtectedRoute", () => {
  function renderWithAuth(options: {
    user: User | null;
    loading: boolean;
    error: Error | null;
    initialPath?: string;
    roles?: ("CUSTOMER" | "OPERATOR")[];
  }) {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: options.user,
      loading: options.loading,
      error: options.error,
      login: vi.fn(),
      logout: vi.fn(),
    });

    let captured: React.ReactElement<{ to?: string }> | null = null;
    function Inspector() {
      const el = ProtectedRoute({
        children: <div>Protected Content</div>,
        roles: options.roles,
      });
      captured = el as React.ReactElement<{ to?: string }>;
      return <div>{el}</div>;
    }

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[options.initialPath ?? "/protected"]}>
        <Inspector />
      </MemoryRouter>
    );

    return { html, getCaptured: () => captured };
  }

  it("renders loading indicator when auth is loading", () => {
    const { html } = renderWithAuth({
      user: null,
      loading: true,
      error: null,
    });
    expect(html).toContain("Loading…");
  });

  it("renders error alert instead of redirecting when auth check fails with error", () => {
    const { html, getCaptured } = renderWithAuth({
      user: null,
      loading: false,
      error: new Error("Backend connection failed"),
    });
    expect(html).toContain("Failed to verify authentication status");
    expect(getCaptured()?.type).not.toBe(Navigate);
  });

  it("redirects to /login when unauthenticated without error", () => {
    const { getCaptured } = renderWithAuth({
      user: null,
      loading: false,
      error: null,
    });
    expect(getCaptured()?.type).toBe(Navigate);
    expect(getCaptured()?.props.to).toBe("/login");
  });

  it("renders protected content when user has allowed role", () => {
    const { html } = renderWithAuth({
      user: { id: 1, email: "c@test.com", displayName: "Customer", role: "CUSTOMER" },
      loading: false,
      error: null,
      roles: ["CUSTOMER"],
    });
    expect(html).toContain("Protected Content");
  });

  it("redirects to roleHome when user does not have allowed role", () => {
    const { getCaptured } = renderWithAuth({
      user: { id: 1, email: "c@test.com", displayName: "Customer", role: "CUSTOMER" },
      loading: false,
      error: null,
      roles: ["OPERATOR"],
      initialPath: "/operator/orders",
    });
    expect(getCaptured()?.type).toBe(Navigate);
    expect(getCaptured()?.props.to).toBe("/menu");
  });

  it("renders forbidden message without redirecting when authenticated user with disallowed role is on destination route", () => {
    const { html, getCaptured } = renderWithAuth({
      user: { id: 1, email: "c@test.com", displayName: "Customer", role: "CUSTOMER" },
      loading: false,
      error: null,
      roles: ["OPERATOR"],
      initialPath: "/menu",
    });
    expect(getCaptured()?.type).not.toBe(Navigate);
    expect(html).toContain("403 Forbidden");
    expect(html).toContain("no access");
  });
});
