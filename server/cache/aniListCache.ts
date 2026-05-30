import { createHash } from "crypto";
import { getCacheStore } from "./cacheStore";
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

export async function invalidateUserAniListCache(userId: string): Promise<void> {
  const store = getCacheStore();
  await store.deleteByPrefix(`${PROXY_CACHE_PREFIX}${userId}:`);
  await store.deleteByPrefix(`${LIST_SNAPSHOT_PREFIX}${userId}:`);
  logger.debug(`[Cache] Invalidated AniList cache for user ${userId}`);
}
