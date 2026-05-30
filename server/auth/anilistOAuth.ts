import { ANILIST_GRAPHQL_URL, ANILIST_TOKEN_URL } from "../constants";
import type { AniListUser } from "../types";
import { storage } from "../storage";
import { getBackendCallbackUrl } from "./urls";
import { logger } from "../logger";
import { prefetchListSnapshots } from "../cache/prefetchListSnapshots";

export type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

interface AniListViewer {
  id: number;
  name: string;
  avatar?: { medium?: string };
}

export async function exchangeCodeForAccessToken(
  code: string,
  fetchFn: FetchFunction = fetch
): Promise<{ accessToken: string; expiresIn?: number }> {
  const clientId = process.env.ANILIST_CLIENT_ID;
  const clientSecret = process.env.ANILIST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Server configuration error.");
  }

  const payload = {
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getBackendCallbackUrl(),
    code,
  };

  logger.debug("[AniList OAuth] Exchanging authorization code for access token...");

  const tokenRes = await fetchFn(ANILIST_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({ message: "Failed to parse error response" }));
    throw new Error(
      `Failed to get access token: ${err.error_description || err.message || tokenRes.statusText}`
    );
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string | undefined;
  const expiresIn = tokenData.expires_in as number | undefined;

  if (!accessToken) {
    throw new Error("Access token missing in AniList response.");
  }

  return {
    accessToken,
    expiresIn: typeof expiresIn === "number" ? expiresIn : undefined,
  };
}

export async function fetchAniListViewer(
  accessToken: string,
  fetchFn: FetchFunction = fetch
): Promise<AniListViewer> {
  const userRes = await fetchFn(ANILIST_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: `query { Viewer { id name avatar { medium } } }`,
    }),
  });

  if (!userRes.ok) {
    const err = await userRes.json().catch(() => ({ message: "Failed to parse error response" }));
    throw new Error(`Failed to get user info: ${err.message || userRes.statusText}`);
  }

  const userData = await userRes.json();
  const viewer = userData.data?.Viewer as AniListViewer | undefined;

  if (!viewer?.id) {
    throw new Error("Failed to parse user info from AniList.");
  }

  return viewer;
}

export async function persistAniListLogin(
  accessToken: string,
  expiresIn: number | undefined,
  viewer: AniListViewer
): Promise<AniListUser> {
  const userId = viewer.id.toString();

  await storage.storeToken(
    userId,
    accessToken,
    typeof expiresIn === "number" ? expiresIn : undefined
  );
  await storage.storeUserInfo(userId, viewer.name, viewer.avatar?.medium);

  prefetchListSnapshots(userId, accessToken);

  return {
    id: userId,
    username: viewer.name,
    avatarUrl: viewer.avatar?.medium,
  };
}

export async function completeAniListOAuth(
  code: string,
  fetchFn: FetchFunction = fetch
): Promise<AniListUser> {
  const { accessToken, expiresIn } = await exchangeCodeForAccessToken(code, fetchFn);
  const viewer = await fetchAniListViewer(accessToken, fetchFn);
  return persistAniListLogin(accessToken, expiresIn, viewer);
}
