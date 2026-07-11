import { randomUUID } from "crypto";
import { getCacheStore } from "./cacheStore";
import { logger } from "../logger";

/**
 * Per-user cache invalidation epochs, stored in the shared cache store
 * (Redis in production) so they are visible across server replicas.
 *
 * A read captures the user's epoch when it starts; invalidation writes a
 * fresh token, so a read that was already in flight when a mutation
 * invalidated the cache — on any instance — sees a different epoch when it
 * finishes and must not commit its pre-mutation response.
 *
 * Epochs are opaque unique tokens rather than counters: bumping is a plain
 * SET, so concurrent invalidations never race an increment, and any bump
 * differs from every previously captured value.
 */
const EPOCH_KEY_PREFIX = "anilistcal:epoch:";

/** Longer than any in-flight AniList read; refreshed on every bump. */
const EPOCH_TTL_SEC = 60 * 60;

/** Epoch value when no invalidation has been recorded (or the key expired). */
const INITIAL_EPOCH = "initial";

export async function getUserCacheEpoch(userId: string): Promise<string> {
  try {
    const value = await getCacheStore().get(`${EPOCH_KEY_PREFIX}${userId}`);
    return value ?? INITIAL_EPOCH;
  } catch (error) {
    logger.warn(`[Cache] Failed to read epoch for user ${userId}:`, error);
    // A unique fallback never matches a captured epoch, so the caller skips
    // caching rather than risking a stale write.
    return `error:${randomUUID()}`;
  }
}

export async function bumpUserCacheEpoch(userId: string): Promise<void> {
  await getCacheStore().set(
    `${EPOCH_KEY_PREFIX}${userId}`,
    randomUUID(),
    EPOCH_TTL_SEC
  );
}
