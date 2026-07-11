import { ANILIST_GRAPHQL_URL } from "../constants";
import {
  deleteCachedProxyResponse,
  getProxyCacheKey,
  setCachedProxyResponse,
} from "./aniListCache";
import { getUserCacheEpoch } from "./invalidationEpoch";
import { logger } from "../logger";

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

interface InFlightRequest {
  epoch: string;
  promise: Promise<AniListResponse>;
}

const inFlight = new Map<string, InFlightRequest>();

/**
 * Fetch a read query from AniList on behalf of a user.
 *
 * Concurrent identical requests (same user, query, and variables) share one
 * upstream call — e.g. the session-restore prefetch and the client's list
 * request racing each other resolve from a single AniList round trip.
 * Successful, error-free responses are written to the proxy cache so the next
 * request is served without hitting AniList at all.
 *
 * Each request captures the user's cache invalidation epoch (shared across
 * server replicas via the cache store) when it starts. If a mutation
 * invalidates the user's cache while the read is in flight — on any instance
 * — the epoch moves on and the read's pre-mutation response is discarded
 * instead of being written back into the freshly invalidated cache; later
 * callers start a fresh fetch rather than joining the stale one.
 *
 * Read queries only — mutations must never be coalesced or cached.
 */
export async function fetchAniListQuery(
  userId: string,
  accessToken: string,
  query: string,
  variables: unknown
): Promise<AniListResponse> {
  const key = getProxyCacheKey(userId, query, variables);
  const epoch = await getUserCacheEpoch(userId);

  // No awaits between here and inFlight.set below — the check-then-set is
  // atomic within this microtask, so concurrent callers coalesce reliably.
  const existing = inFlight.get(key);
  if (existing && existing.epoch === epoch) {
    return existing.promise;
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
      try {
        await commitToCache(userId, query, variables, body, epoch);
      } catch (error) {
        // Cache bookkeeping must never fail the read itself.
        logger.warn(`[Cache] Failed to store response for user ${userId}:`, error);
      }
    }

    return { status: apiRes.status, ok: apiRes.ok, body };
  })().finally(() => {
    if (inFlight.get(key)?.promise === request) {
      inFlight.delete(key);
    }
  });

  inFlight.set(key, { epoch, promise: request });
  return request;
}

/**
 * Commit a response to the cache, fenced by the invalidation epoch.
 *
 * The epoch check and the write cannot be one atomic store operation, so the
 * write is verified after the fact: write, re-read the epoch, and evict the
 * just-written entries if it moved on. Every interleaving with an
 * invalidation (epoch bump B, then evictions D) is covered — if B lands
 * before the re-check, the re-check sees it and this read evicts its own
 * write; if B lands after the re-check, D runs after this read's write and
 * removes it. Either way no stale entry survives.
 */
async function commitToCache(
  userId: string,
  query: string,
  variables: unknown,
  body: unknown,
  epoch: string
): Promise<void> {
  if ((await getUserCacheEpoch(userId)) !== epoch) {
    return;
  }

  await setCachedProxyResponse(userId, query, variables, body);

  if ((await getUserCacheEpoch(userId)) !== epoch) {
    await deleteCachedProxyResponse(userId, query, variables);
  }
}
