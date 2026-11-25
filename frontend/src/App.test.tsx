import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppShell, formatShortVersion } from "./App";
import { AuthProvider } from "./auth/AuthContext";

describe("Frontend app shell", () => {
  it("renders the Omazon header and the login form", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Omazon");
    expect(html).toContain("Log in (deployed via CI/CD)");
    expect(html).toContain("Email");
    expect(html).toContain("Password");
    expect(html).toContain("Version:");
  });

  it("formats long commit SHAs to 7 characters and falls back to dev", () => {
    expect(formatShortVersion("61e1a3c5134a118da3c16b8b72e11d04c6b2363b")).toBe("61e1a3c");
    expect(formatShortVersion("1.0.0")).toBe("1.0.0");
    expect(formatShortVersion("  ")).toBe("dev");
    expect(formatShortVersion(undefined)).toBe("dev");
  });
});
