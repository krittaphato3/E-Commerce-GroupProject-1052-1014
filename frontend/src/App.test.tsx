import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "./App";
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
    expect(html).toContain("Log in");
    expect(html).toContain("Email");
    expect(html).toContain("Password");
  });
});
