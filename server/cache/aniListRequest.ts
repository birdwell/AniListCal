import { ANILIST_GRAPHQL_URL } from "../constants";
import { getProxyCacheKey, setCachedProxyResponse } from "./aniListCache";

export interface AniListResponse {
  status: number;
  ok: boolean;
  body: unknown;
}

/** True when a GraphQL response body carries a non-empty errors array. */
export function hasGraphQLErrors(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "errors" in body &&
    Array.isArray((body as { errors?: unknown[] }).errors) &&
    (body as { errors: unknown[] }).errors.length > 0
  );
}

const inFlight = new Map<string, Promise<AniListResponse>>();

/**
 * Fetch a read query from AniList on behalf of a user.
 *
 * Concurrent identical requests (same user, query, and variables) share one
 * upstream call — e.g. the session-restore prefetch and the client's list
 * request racing each other resolve from a single AniList round trip.
 * Successful, error-free responses are written to the proxy cache so the next
 * request is served without hitting AniList at all.
 *
 * Read queries only — mutations must never be coalesced or cached.
 */
export function fetchAniListQuery(
  userId: string,
  accessToken: string,
  query: string,
  variables: unknown
): Promise<AniListResponse> {
  const key = getProxyCacheKey(userId, query, variables);
  const existing = inFlight.get(key);
  if (existing) {
    return existing;
  }

  const request = (async (): Promise<AniListResponse> => {
    const apiRes = await fetch(ANILIST_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    let body: unknown;
    try {
      body = await apiRes.json();
    } catch {
      body = undefined;
    }

    if (apiRes.ok && body !== undefined && !hasGraphQLErrors(body)) {
      await setCachedProxyResponse(userId, query, variables, body);
    }

    return { status: apiRes.status, ok: apiRes.ok, body };
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, request);
  return request;
}
