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

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/**
 * Fetches a user's anime list from AniList
 * @param userId The AniList user ID
 * @param accessToken Access token for authenticated requests
 * @returns Array of media list entries
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
    const accessToken = sessionStorage.getItem("accessToken");
    const client = new GraphQLClient(ANILIST_GRAPHQL_URL, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    const variables: GetUserMediaListQueryVariables = {
      userId,
      status,
    };

    const response = await client.request<GetUserMediaListQuery>(
      GET_USER_MEDIA_LIST_QUERY,
      variables
    );

    const lists = response.MediaListCollection?.lists ?? [];
    return lists
      .flatMap((list) => list?.entries?.filter((entry) => entry !== null) ?? [])
      .filter(Boolean) as EntyFragmentFragment[];
  } catch (error) {
    console.error("Error fetching anime list:", error);
    throw error;
  }
}

/**
 * Fetches details for a specific anime by ID
 * @param id The anime ID
 * @returns Media details
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
      throw new Error("Anime not found");
    }

    return media;
  } catch (error) {
    console.error("Error fetching anime details:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch anime details");
  }
}
