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

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/**
 * Generate a cache key for anime list requests
 */
function getAnimeListCacheKey(
  userId: string,
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
  userId: string,
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
        console.log("Using cached anime list data");
        return cachedData;
      }
    }

    console.log("Fetching fresh anime list data from AniList API");

    // Use the queryAniList function which uses the server proxy
    const response = await queryAniList<GetUserMediaListQuery>(
      GET_USER_MEDIA_LIST_QUERY,
      {
        userId: parseInt(userId, 10),
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
    console.error("Error fetching anime list:", error);
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
        console.log(`Using cached data for anime ID ${id}`);
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
    console.error("Error fetching anime details:", error);
    throw error;
  }
}
