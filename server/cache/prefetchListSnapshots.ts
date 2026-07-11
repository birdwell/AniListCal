import { logger } from "../logger";
import {
  GET_USER_MEDIA_LIST_QUERY,
  PREFETCH_LIST_STATUS_SETS,
} from "../queries/mediaListQuery";
import { getCachedProxyResponse } from "./aniListCache";
import { fetchAniListQuery, hasGraphQLErrors } from "./aniListRequest";

/**
 * Warm list snapshots after login and on session restore so the first
 * home/calendar load is served from cache (or joins the in-flight fetch)
 * instead of waiting a full AniList round trip.
 *
 * Runs in the background; already-warm status sets are skipped and failures
 * are logged only.
 */
export function prefetchListSnapshots(
  userId: string,
  accessToken: string
): void {
  void (async () => {
    const numericUserId = Number.parseInt(userId, 10);
    if (!Number.isFinite(numericUserId)) return;

    for (const status of PREFETCH_LIST_STATUS_SETS) {
      const variables = { userId: numericUserId, status };

      try {
        const cached = await getCachedProxyResponse(
          userId,
          GET_USER_MEDIA_LIST_QUERY,
          variables
        );
        if (cached) continue;

        const apiRes = await fetchAniListQuery(
          userId,
          accessToken,
          GET_USER_MEDIA_LIST_QUERY,
          variables
        );

        if (!apiRes.ok) {
          logger.warn(
            `[Cache] Prefetch failed for user ${userId} (${status.join(",")}): HTTP ${apiRes.status}`
          );
        } else if (hasGraphQLErrors(apiRes.body)) {
          logger.warn(
            `[Cache] Prefetch GraphQL errors for user ${userId}:`,
            (apiRes.body as { errors: unknown[] }).errors
          );
        }
      } catch (error) {
        logger.warn(`[Cache] Prefetch error for user ${userId}:`, error);
      }
    }

    logger.debug(`[Cache] Prefetch complete for user ${userId}`);
  })();
}
