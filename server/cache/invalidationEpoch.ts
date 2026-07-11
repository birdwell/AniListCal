import { randomUUID } from "crypto";
import { getCacheStore } from "./cacheStore";
import { logger } from "../logger";

/**
 * Per-user cache invalidation epochs.
 *
 * A read captures the user's epoch when it starts; invalidation bumps the
 * epoch, so a read that was already in flight when a mutation invalidated the
 * cache sees a different epoch when it finishes and must not commit its
 * pre-mutation response.
 *
 * The epoch is composite: a process-local generation counter plus a shared
 * token in the cache store (Redis in production). The shared token makes
 * invalidation visible across server replicas; the local generation is a
 * floor that still protects same-process reads when the shared store write
 * fails. Shared tokens are opaque unique values rather than counters:
 * bumping is a plain SET, so concurrent invalidations never race an
 * increment, and any bump differs from every previously captured value.
 */
const EPOCH_KEY_PREFIX = "anilistcal:epoch:";

/** Longer than any in-flight AniList read; refreshed on every bump. */
const EPOCH_TTL_SEC = 60 * 60;

/** Shared token when no invalidation has been recorded (or the key expired). */
const INITIAL_EPOCH = "initial";

const localGenerations = new Map<string, number>();

export async function getUserCacheEpoch(userId: string): Promise<string> {
  const local = localGenerations.get(userId) ?? 0;
  let shared: string;
  try {
    const value = await getCacheStore().get(`${EPOCH_KEY_PREFIX}${userId}`);
    shared = value ?? INITIAL_EPOCH;
  } catch (error) {
    logger.warn(`[Cache] Failed to read epoch for user ${userId}:`, error);
    // A unique fallback never matches a captured epoch, so the caller skips
    // caching rather than risking a stale write.
    shared = `error:${randomUUID()}`;
  }
  return `${local}:${shared}`;
}

/**
 * Advance the user's epoch. The local generation is bumped first and cannot
 * fail; a shared-store failure is thrown to the caller but same-process reads
 * are already protected by the local bump.
 */
export async function bumpUserCacheEpoch(userId: string): Promise<void> {
  localGenerations.set(userId, (localGenerations.get(userId) ?? 0) + 1);
  await getCacheStore().set(
    `${EPOCH_KEY_PREFIX}${userId}`,
    randomUUID(),
    EPOCH_TTL_SEC
  );
}
