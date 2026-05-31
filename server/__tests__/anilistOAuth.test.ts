import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  exchangeCodeForAccessToken,
  fetchAniListViewer,
  completeAniListOAuth,
} from "../auth/anilistOAuth";
import { storage } from "../storage";
import { ANILIST_TOKEN_URL, ANILIST_GRAPHQL_URL } from "../constants";

process.env.ANILIST_CLIENT_ID = "mockClientId";
process.env.ANILIST_CLIENT_SECRET = "mockClientSecret";

describe("anilistOAuth", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let storeTokenSpy: ReturnType<typeof vi.spyOn>;
  let storeUserInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    storeTokenSpy = vi.spyOn(storage, "storeToken").mockResolvedValue(undefined);
    storeUserInfoSpy = vi.spyOn(storage, "storeUserInfo").mockResolvedValue(undefined);
  });

  it("throws when user fetch fails", async () => {
    fetchMock.mockImplementationOnce(async () => ({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({ message: "Internal Server Error" }),
    }));

    await expect(fetchAniListViewer("anilist_token", fetchMock)).rejects.toThrow(
      "Failed to get user info: Internal Server Error"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when token exchange fails", async () => {
    fetchMock.mockImplementationOnce(async () => ({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ error_description: "Invalid code" }),
    }));

    await expect(exchangeCodeForAccessToken("badcode", fetchMock)).rejects.toThrow(
      "Failed to get access token: Invalid code"
    );
  });

  it("completes OAuth: exchanges code, fetches viewer, persists login", async () => {
    fetchMock
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({ access_token: "anilist_token", expires_in: 3600 }),
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({
          data: { Viewer: { id: 123, name: "TestUser", avatar: { medium: "avatar_url" } } },
        }),
      }));

    const user = await completeAniListOAuth("testcode", fetchMock);

    expect(fetchMock).toHaveBeenNthCalledWith(1, ANILIST_TOKEN_URL, expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, ANILIST_GRAPHQL_URL, expect.objectContaining({ method: "POST" }));
    expect(storeTokenSpy).toHaveBeenCalledWith("123", "anilist_token", 3600);
    expect(storeUserInfoSpy).toHaveBeenCalledWith("123", "TestUser", "avatar_url", 3600);
    expect(user).toEqual({
      id: "123",
      username: "TestUser",
      avatarUrl: "avatar_url",
    });
  });
});
