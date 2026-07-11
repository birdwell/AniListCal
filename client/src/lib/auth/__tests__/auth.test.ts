import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClear = vi.fn();
const mockSetQueryData = vi.fn();

vi.mock("../../queryClient", () => ({
  queryClient: {
    clear: mockClear,
    setQueryData: mockSetQueryData,
  },
  PERSIST_QUERY_KEY: "anilistcal-query-cache",
}));

global.fetch = vi.fn();

const API_ENDPOINTS = {
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_SESSION: "/api/auth/session",
  AUTH_USER: "/api/auth/user",
};

describe("auth (session cookies)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { href: "" });
  });

  it("login redirects to server OAuth endpoint", async () => {
    const auth = await import("../../auth");
    auth.login();
    expect(window.location.href).toBe(API_ENDPOINTS.AUTH_LOGIN);
  });

  it("checkSession returns true when authenticated", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, user: { id: "123" } }),
    });
    const auth = await import("../../auth");
    await expect(auth.checkSession()).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH_SESSION,
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("logout calls server, clears the cache, and redirects to login", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
    const auth = await import("../../auth");
    await auth.logout();
    expect(fetch).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH_LOGOUT,
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
    expect(mockClear).toHaveBeenCalled();
    expect(window.location.href).toBe("/login");
  });

  it("logout still clears state and redirects when the request fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("429"));
    const auth = await import("../../auth");
    await auth.logout();
    expect(mockClear).toHaveBeenCalled();
    expect(window.location.href).toBe("/login");
  });

  it("getUser returns session user from the server without an AniList call", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: "123",
        username: "TestUser",
        avatarUrl: "avatar.jpg",
      }),
    });
    const auth = await import("../../auth");
    await expect(auth.getUser()).resolves.toEqual({
      id: 123,
      name: "TestUser",
      avatar: { medium: "avatar.jpg" },
    });
    expect(fetch).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH_USER,
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("getUser throws AuthError with code when AniList token expired", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Your AniList authorization has expired. Please sign in again.",
        code: "ANILIST_TOKEN_EXPIRED",
      }),
    });
    const auth = await import("../../auth");
    await expect(auth.getUser()).rejects.toMatchObject({
      code: "ANILIST_TOKEN_EXPIRED",
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(["auth", "user"], null);
  });

  it("getUser throws AuthError without code on generic 401", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Not authenticated" }),
    });
    const auth = await import("../../auth");
    await expect(auth.getUser()).rejects.toMatchObject({ code: undefined });
  });
});
