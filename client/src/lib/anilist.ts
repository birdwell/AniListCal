import { GraphQLClient } from "graphql-request";
import {
  EntyFragmentFragment,
  GetMediaQuery,
  GetUserMediaListQuery,
  GetUserMediaListQueryVariables,
  MediaFragmentFragment,
  MediaListStatus,
} from "@/generated/graphql";
import { GET_USER_MEDIA_LIST_QUERY, GET_MEDIA_QUERY } from "@/queries/queries";
import { LONG_STALE_TIME } from "./query-config";
import {
  animeListCache,
  animeDetailsCache,
  CACHE_EXPIRY,
} from "./cache-service";
import { queryAniList } from "./auth";
import { logger } from "./logger";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/**
 * Generate a cache key for anime list requests
 */
function getAnimeListCacheKey(
  userId: number,
  status: MediaListStatus[]
): string {
  return `${userId}-${status.sort().join(",")}`;
}

/**
 * Fetches a user's anime list from AniList
 * @param userId The AniList user ID
 * @param status Array of status filters
 * @param forceRefresh Whether to bypass cache and force a refresh
 * @returns Array of media list entries
 */
export async function fetchUserAnime(
  userId: number,
  status: MediaListStatus[] = [
    MediaListStatus.Current,
    MediaListStatus.Planning,
    MediaListStatus.Paused,
  ],
  forceRefresh = false
): Promise<EntyFragmentFragment[]> {
  try {
    const cacheKey = getAnimeListCacheKey(userId, status);

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = animeListCache.get<EntyFragmentFragment[]>(cacheKey);
      if (cachedData) {
        logger.debug("Using cached anime list data");
        return cachedData;
      }
    }

    logger.debug("Fetching fresh anime list data from AniList API");

    // Use the queryAniList function which uses the server proxy
    const response = await queryAniList<GetUserMediaListQuery>(
      GET_USER_MEDIA_LIST_QUERY,
      {
        userId,
        status,
      }
    );

    const lists = response.data?.MediaListCollection?.lists ?? [];
    const result = lists
      .flatMap((list) => list?.entries?.filter((entry) => entry !== null) ?? [])
      .filter(Boolean) as EntyFragmentFragment[];

    // Save to cache
    animeListCache.set(cacheKey, result, CACHE_EXPIRY.MEDIUM);

    return result;
  } catch (error) {
    logger.error("Error fetching anime list:", error);
    throw error;
  }
}

/**
 * Clear all anime list cache entries
 */
export function clearAnimeListCache(): void {
  animeListCache.clear();
}

/**
 * Fetches details for a specific anime by ID
 * @param id The anime ID
 * @param forceRefresh Whether to bypass cache and force a refresh
 * @returns Media details
 */
export async function fetchAnimeDetails(
  id: number,
  forceRefresh = false
): Promise<MediaFragmentFragment> {
  try {
    if (!id || isNaN(id)) {
      throw new Error("Invalid anime ID provided");
    }

    const cacheKey = id.toString();

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = animeDetailsCache.get<MediaFragmentFragment>(cacheKey);
      if (cachedData) {
        logger.debug(`Using cached data for anime ID ${id}`);
        return cachedData;
      }
    }

    // Use the AniList public API directly for public anime details (no auth needed)
    const client = new GraphQLClient(ANILIST_GRAPHQL_URL);
    const response = await client.request<GetMediaQuery>(GET_MEDIA_QUERY, {
      id,
    });
    const media = response.Media;

    if (!media) {
      throw new Error(`Anime with ID ${id} not found`);
    }

    // Save to cache
    animeDetailsCache.set(cacheKey, media, CACHE_EXPIRY.LONG);

    return media;
  } catch (error) {
    logger.error("Error fetching anime details:", error);
    throw error;
  }
}

/**
 * Fetches anime details with user-specific data (requires authentication)
 * @param id Anime ID
 * @param forceRefresh Whether to bypass cache and force a refresh
 * @returns Media details including user-specific data like mediaListEntry
 */
export async function fetchAuthenticatedAnimeDetails(
  id: number,
  forceRefresh = false
): Promise<MediaFragmentFragment> {
  try {
    if (!id || isNaN(id)) {
      throw new Error("Invalid anime ID provided");
    }

    // Get the current user
    const user = await import("./auth").then(m => m.getUser());
    if (!user) {
      logger.warn("No authenticated user found, falling back to public API");
      return fetchAnimeDetails(id, forceRefresh);
    }

    const userId = user.id;  // user.id is already a number
    const cacheKey = `auth-${userId}-${id}`;

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = animeDetailsCache.get<MediaFragmentFragment>(cacheKey);
      if (cachedData) {
        logger.debug(`Using cached authenticated data for anime ID ${id}`);
        return cachedData;
      }
    }

    // Use the authenticated query method directly from the auth module
    // This ensures we're using the same authentication pattern as other calls
    const { queryAniList } = await import("./auth");
    const response = await queryAniList<GetMediaQuery>(GET_MEDIA_QUERY, {
      id
      // We don't need to pass userId here as the server will get it from the auth token
    });

    const media = response.data?.Media;

    if (!media) {
      throw new Error(`Anime with ID ${id} not found`);
    }

    // Save to cache
    animeDetailsCache.set(cacheKey, media, CACHE_EXPIRY.LONG);

    return media;
  } catch (error) {
    logger.error("Error fetching authenticated anime details:", error);
    throw error;
  }
}
