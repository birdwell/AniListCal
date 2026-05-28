import { describe, it, expect } from "vitest";
import { isAniListAuthFailure } from "../auth/clearSession";

describe("isAniListAuthFailure", () => {
  it("detects HTTP 401", () => {
    expect(isAniListAuthFailure(401, undefined)).toBe(true);
  });

  it("detects GraphQL auth errors in response body", () => {
    expect(
      isAniListAuthFailure(200, { errors: [{ message: "Invalid token", status: 401 }] })
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(
      isAniListAuthFailure(500, { errors: [{ message: "Internal server error" }] })
    ).toBe(false);
  });
});
