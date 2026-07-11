/**
 * Per-user cache invalidation epochs.
 *
 * A read captures the user's epoch when it starts; invalidation bumps the
 * epoch, so a read that was already in flight when a mutation invalidated the
 * cache can detect it finished too late and must not commit its (pre-mutation)
 * response.
 *
 * In-memory, like the in-flight request coalescing map: correct for a single
 * server instance. With multiple replicas a cross-instance race is still
 * bounded by the proxy cache TTL.
 */
const epochs = new Map<string, number>();

export function getUserCacheEpoch(userId: string): number {
  return epochs.get(userId) ?? 0;
}

export function bumpUserCacheEpoch(userId: string): void {
  epochs.set(userId, getUserCacheEpoch(userId) + 1);
}
