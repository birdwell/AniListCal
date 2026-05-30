import { GraphQLClient } from "graphql-request";
import {
  EntyFragmentFragment,
  GetMediaQuery,
  GetUserMediaListQuery,
  MediaFragmentFragment,
  MediaListStatus,
} from "@/generated/graphql";
import { GET_USER_MEDIA_LIST_QUERY, GET_MEDIA_QUERY } from "@/queries/queries";
import { queryAniList } from "./anilistProxy";
import { logger } from "./logger";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/**
 * Fetches a user's anime list from AniList via the authenticated server proxy.
 * Client-side caching is handled by React Query Persist.
 */
export async function fetchUserAnime(
  userId: number,
  status: MediaListStatus[] = [
    MediaListStatus.Current,
    MediaListStatus.Planning,
    MediaListStatus.Paused,
  ]
): Promise<EntyFragmentFragment[]> {
  try {
    logger.debug("Fetching anime list data from AniList API");

    const response = await queryAniList<GetUserMediaListQuery>(
      GET_USER_MEDIA_LIST_QUERY,
      {
        userId,
        status,
      }
    );

    const lists = response.data?.MediaListCollection?.lists ?? [];
    return lists
      .flatMap((list) => list?.entries?.filter((entry) => entry !== null) ?? [])
      .filter(Boolean) as EntyFragmentFragment[];
  } catch (error) {
    logger.error("Error fetching anime list:", error);
    throw error;
  }
}

/**
 * Fetches public anime details directly from AniList (no auth required).
 */
export async function fetchAnimeDetails(
  id: number
): Promise<MediaFragmentFragment> {
  try {
    if (!id || isNaN(id)) {
      throw new Error("Invalid anime ID provided");
    }

    const client = new GraphQLClient(ANILIST_GRAPHQL_URL);
    const response = await client.request<GetMediaQuery>(GET_MEDIA_QUERY, {
      id,
    });
    const media = response.Media;

    if (!media) {
      throw new Error(`Anime with ID ${id} not found`);
    }

    return media;
  } catch (error) {
    logger.error("Error fetching anime details:", error);
    throw error;
  }
}

/**
 * Fetches anime details with user-specific data (requires authentication).
 */
export async function fetchAuthenticatedAnimeDetails(
  id: number
): Promise<MediaFragmentFragment> {
  try {
    if (!id || isNaN(id)) {
      throw new Error("Invalid anime ID provided");
    }

    const user = await import("./auth").then((m) => m.getUser());
    if (!user) {
      logger.warn("No authenticated user found, falling back to public API");
      return fetchAnimeDetails(id);
    }

    const response = await queryAniList<GetMediaQuery>(GET_MEDIA_QUERY, {
      id,
    });

    const media = response.data?.Media;

    if (!media) {
      throw new Error(`Anime with ID ${id} not found`);
    }

    return media;
  } catch (error) {
    logger.error("Error fetching authenticated anime details:", error);
    throw error;
  }
}
