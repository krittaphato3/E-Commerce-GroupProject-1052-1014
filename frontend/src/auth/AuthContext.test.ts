import { describe, it, expect } from "vitest";
import { classifyAuthError } from "./AuthContext";
import { ApiRequestError } from "../api/client";

describe("AuthContext error classification", () => {
  it("treats ApiRequestError with status 401 as unauthenticated (logged out, no error)", () => {
    const result = classifyAuthError(
      new ApiRequestError(401, "UNAUTHENTICATED", "Unauthorized")
    );
    expect(result.user).toBeNull();
    expect(result.error).toBeNull();
  });

  it("surfaces non-401 ApiRequestError (e.g. 500) as an error", () => {
    const result = classifyAuthError(
      new ApiRequestError(500, "INTERNAL_ERROR", "Server failure")
    );
    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("Server failure");
  });

  it("surfaces network or unexpected errors as an error", () => {
    const result = classifyAuthError(new TypeError("Failed to fetch"));
    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(TypeError);
    expect(result.error?.message).toBe("Failed to fetch");
  });
});
