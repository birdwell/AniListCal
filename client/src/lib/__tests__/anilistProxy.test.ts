import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSetQueryData = vi.fn();

vi.mock("../queryClient", () => ({
  queryClient: {
    setQueryData: mockSetQueryData,
  },
  PERSIST_QUERY_KEY: "anilistcal-query-cache",
}));

global.fetch = vi.fn();

const ANILIST_PROXY = "/api/anilist/proxy";

describe("queryAniList rate-limit circuit breaker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("fails fast after a 429 without re-hitting the proxy", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: () => "30" },
      json: async () => ({ error: "Too many requests" }),
    });
    const { queryAniList } = await import("../anilistProxy");

    await expect(
      queryAniList(`query { Viewer { id } }`)
    ).rejects.toThrow(/too many requests/i);
    expect(fetch).toHaveBeenCalledTimes(1);

    await expect(
      queryAniList(`query { Viewer { id } }`)
    ).rejects.toThrow(/too many requests/i);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("resetRateLimitCircuit allows requests after a 429", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: () => "30" },
      json: async () => ({ error: "Too many requests" }),
    });
    const { queryAniList, resetRateLimitCircuit } = await import("../anilistProxy");

    await expect(queryAniList(`query { Viewer { id } }`)).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);

    resetRateLimitCircuit();

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { Viewer: { id: 1 } } }),
    });

    await expect(queryAniList(`query { Viewer { id } }`)).resolves.toMatchObject({
      data: { Viewer: { id: 1 } },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("queryAniList auth errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("clears auth cache and throws AuthError on 401", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Your AniList authorization has expired. Please sign in again.",
        code: "ANILIST_TOKEN_EXPIRED",
      }),
    });
    const { queryAniList } = await import("../anilistProxy");
    const { AuthError } = await import("../auth/session");

    await expect(queryAniList(`query { Viewer { id } }`)).rejects.toBeInstanceOf(
      AuthError
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(["auth", "user"], null);
  });
});
