import { createHash } from "crypto";
import { getCacheStore } from "./cacheStore";
import { bumpUserCacheEpoch } from "./invalidationEpoch";
import { logger } from "../logger";

export const PROXY_CACHE_PREFIX = "anilistcal:proxy:";
export const LIST_SNAPSHOT_PREFIX = "anilistcal:list:";

function getProxyCacheTtlSec(): number {
  const raw = process.env.ANILIST_PROXY_CACHE_TTL_SEC;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 600;
}

function getListSnapshotTtlSec(): number {
  const raw = process.env.ANILIST_LIST_SNAPSHOT_TTL_SEC;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1800;
}

export function isGraphQLMutation(query: string): boolean {
  const normalized = query.replace(/\s+/g, " ").trim();
  return /^mutation\b/i.test(normalized);
}

export function isMediaListQuery(query: string): boolean {
  return query.includes("MediaListCollection");
}

function hashQueryPayload(query: string, variables: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify({ query, variables }))
    .digest("hex")
    .slice(0, 24);
}

export function getProxyCacheKey(
  userId: string,
  query: string,
  variables: unknown
): string {
  return `${PROXY_CACHE_PREFIX}${userId}:${hashQueryPayload(query, variables)}`;
}

export function getListSnapshotKey(
  userId: string,
  variables: Record<string, unknown> | undefined
): string | null {
  if (!variables || variables.userId == null || variables.status == null) {
    return null;
  }

  const statuses = Array.isArray(variables.status)
    ? [...variables.status].map(String).sort().join(",")
    : String(variables.status);

  return `${LIST_SNAPSHOT_PREFIX}${userId}:${statuses}`;
}

export async function getCachedProxyResponse(
  userId: string,
  query: string,
  variables: unknown
): Promise<unknown | null> {
  const store = getCacheStore();
  const proxyKey = getProxyCacheKey(userId, query, variables);

  const cachedProxy = await store.get(proxyKey);
  if (cachedProxy) {
    logger.debug(`[Cache] Proxy hit for user ${userId}`);
    return JSON.parse(cachedProxy);
  }

  if (isMediaListQuery(query)) {
    const listKey = getListSnapshotKey(userId, variables as Record<string, unknown>);
    if (listKey) {
      const cachedList = await store.get(listKey);
      if (cachedList) {
        logger.debug(`[Cache] List snapshot hit for user ${userId}`);
        return JSON.parse(cachedList);
      }
    }
  }

  return null;
}

export async function setCachedProxyResponse(
  userId: string,
  query: string,
  variables: unknown,
  responseBody: unknown
): Promise<void> {
  const store = getCacheStore();
  const serialized = JSON.stringify(responseBody);
  const proxyKey = getProxyCacheKey(userId, query, variables);

  await store.set(proxyKey, serialized, getProxyCacheTtlSec());

  if (isMediaListQuery(query)) {
    const listKey = getListSnapshotKey(userId, variables as Record<string, unknown>);
    if (listKey) {
      await store.set(listKey, serialized, getListSnapshotTtlSec());
      logger.debug(`[Cache] Stored list snapshot for user ${userId}`);
    }
  }
}

/** Backoff schedule for re-attempting a failed shared epoch bump. */
const EPOCH_BUMP_RETRY_DELAYS_MS = [250, 1000, 4000, 15000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function evictUserEntries(userId: string): Promise<void> {
  const store = getCacheStore();
  await store.deleteByPrefix(`${PROXY_CACHE_PREFIX}${userId}:`);
  await store.deleteByPrefix(`${LIST_SNAPSHOT_PREFIX}${userId}:`);
}

export async function invalidateUserAniListCache(userId: string): Promise<void> {
  // Bump first so reads already in flight see the new epoch and refuse to
  // write their pre-invalidation responses back into the cache. A failed
  // bump must not prevent evicting the stale entries below — the successful
  // mutation would otherwise stay backed by stale cached lists.
  let bumped = true;
  try {
    await bumpUserCacheEpoch(userId);
  } catch (error) {
    bumped = false;
    logger.warn(`[Cache] Failed to bump epoch for user ${userId}:`, error);
  }

  await evictUserEntries(userId);

  if (!bumped) {
    // Without the shared bump, a pre-mutation read on another replica still
    // observes the old epoch and could commit its stale response after the
    // eviction above. Make the fence durable: keep retrying the bump in the
    // background, and evict again once it lands so anything committed in the
    // gap is removed. Reads on this replica are already fenced by the local
    // generation, and a replica whose epoch reads also fail skips caching.
    void retryEpochBumpAndReEvict(userId);
  }

  logger.debug(`[Cache] Invalidated AniList cache for user ${userId}`);
}

async function retryEpochBumpAndReEvict(userId: string): Promise<void> {
  for (const delayMs of EPOCH_BUMP_RETRY_DELAYS_MS) {
    await sleep(delayMs);
    try {
      await bumpUserCacheEpoch(userId);
    } catch {
      continue;
    }
    try {
      await evictUserEntries(userId);
    } catch (error) {
      logger.warn(`[Cache] Post-recovery eviction failed for user ${userId}:`, error);
    }
    logger.warn(`[Cache] Shared epoch bump for user ${userId} recovered after retry.`);
    return;
  }
  logger.error(
    `[Cache] Could not advance the shared invalidation epoch for user ${userId}; ` +
      `another replica may serve stale lists until the cache TTL expires.`
  );
}

/**
 * Delete the entries a single read query wrote — used when the read finished
 * its cache write only to find its invalidation epoch had moved on.
 */
export async function deleteCachedProxyResponse(
  userId: string,
  query: string,
  variables: unknown
): Promise<void> {
  const store = getCacheStore();
  await store.delete(getProxyCacheKey(userId, query, variables));
  if (isMediaListQuery(query)) {
    const listKey = getListSnapshotKey(userId, variables as Record<string, unknown>);
    if (listKey) {
      await store.delete(listKey);
    }
  }
}
