import { ANILIST_GRAPHQL_URL } from "../constants";
import { logger } from "../logger";
import {
  GET_USER_MEDIA_LIST_QUERY,
  PREFETCH_LIST_STATUS_SETS,
} from "../queries/mediaListQuery";
import { setCachedProxyResponse } from "./aniListCache";

/**
 * Warm list snapshots after login so the first home/calendar load is fast.
 * Runs in the background; failures are logged only.
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
        const apiRes = await fetch(ANILIST_GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: GET_USER_MEDIA_LIST_QUERY,
            variables,
          }),
        });

        if (!apiRes.ok) {
          logger.warn(
            `[Cache] Prefetch failed for user ${userId} (${status.join(",")}): HTTP ${apiRes.status}`
          );
          continue;
        }

        const responseBody = await apiRes.json();
        if (responseBody.errors?.length) {
          logger.warn(
            `[Cache] Prefetch GraphQL errors for user ${userId}:`,
            responseBody.errors
          );
          continue;
        }

        await setCachedProxyResponse(
          userId,
          GET_USER_MEDIA_LIST_QUERY,
          variables,
          responseBody
        );
      } catch (error) {
        logger.warn(`[Cache] Prefetch error for user ${userId}:`, error);
      }
    }

    logger.debug(`[Cache] Prefetch complete for user ${userId}`);
  })();
}
