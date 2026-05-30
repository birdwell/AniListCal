/**
 * React Query configuration constants
 */

// Default stale time for queries (5 minutes)
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

// Longer stale time for less frequently changing data (30 minutes)
export const LONG_STALE_TIME = 30 * 60 * 1000;

// Short stale time for frequently changing data (1 minute)
export const SHORT_STALE_TIME = 1 * 60 * 1000;

// Cache time (how long inactive data remains in cache - 1 hour)
export const DEFAULT_CACHE_TIME = 60 * 60 * 1000;

/** Avoid amplifying rate-limit (429) or auth (401) failures with retries. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof Error) {
    if (error.name === "AuthError") return false;
    const message = error.message.toLowerCase();
    if (message.includes("429") || message.includes("too many requests")) {
      return false;
    }
  }
  return true;
}

/**
 * Common query options that can be spread into useQuery configurations
 */
export const commonQueryOptions = {
  staleTime: DEFAULT_STALE_TIME,
  retry: shouldRetryQuery,
  refetchOnWindowFocus: true,
};
