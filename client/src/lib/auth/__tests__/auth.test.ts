import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInvalidateQueries = vi.fn();

vi.mock("../../queryClient", () => ({
  queryClient: {
    invalidateQueries: mockInvalidateQueries,
  },
}));

global.fetch = vi.fn();

const API_ENDPOINTS = {
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_SESSION: "/api/auth/session",
  ANILIST_PROXY: "/api/anilist/proxy",
};

const MOCK_USER = { id: 123, name: "TestUser", avatar: { medium: "avatar.jpg" } };

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

  it("logout calls server and invalidates queries", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
    const auth = await import("../../auth");
    await auth.logout();
    expect(fetch).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH_LOGOUT,
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it("getUser returns viewer data from proxy", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { Viewer: MOCK_USER } }),
    });
    const auth = await import("../../auth");
    await expect(auth.getUser()).resolves.toEqual(MOCK_USER);
    expect(fetch).toHaveBeenCalledWith(
      API_ENDPOINTS.ANILIST_PROXY,
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
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it("getUser returns null on generic 401", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Not authenticated" }),
    });
    const auth = await import("../../auth");
    await expect(auth.getUser()).rejects.toMatchObject({ code: undefined });
  });
});
