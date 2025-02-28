import {
  GetUserMediaListQueryVariables,
  MediaFragmentFragment,
  GetUserMediaListQuery,
  EntyFragmentFragment,
  GetMediaQuery,
} from "@/generated/graphql";
import { request } from "graphql-request";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

import getUserMediaListQuery from "../queries/getUserMediaList.graphql?raw";
import getMediaQuery from "../queries/getMedia.graphql?raw";
import { GET_USER_MEDIA_LIST_QUERY } from "@/queries/queries";

export async function fetchUserAnime(
  userId: number,
  accessToken: string
): Promise<EntyFragmentFragment[]> {
  try {
    const variables: GetUserMediaListQueryVariables = {
      userId: userId,
    };
    const response = await request<GetUserMediaListQuery>(
      ANILIST_GRAPHQL_URL,
      GET_USER_MEDIA_LIST_QUERY,
      variables,
      {
        Authorization: `Bearer ${accessToken}`,
      }
    );

    console.log("Query: ", GET_USER_MEDIA_LIST_QUERY);

    const lists = response.MediaListCollection?.lists ?? [];
    return lists
      .flatMap((list) => list?.entries?.filter((entry) => entry !== null) ?? [])
      .filter((entry) => entry !== null);
  } catch (error) {
    console.error("Error fetching user anime:", error);
    throw error;
  }
}

export async function fetchAnimeDetails(
  id: number
): Promise<MediaFragmentFragment> {
  try {
    if (!id || isNaN(id)) {
      throw new Error("Invalid anime ID provided");
    }

    const response = await request<GetMediaQuery>(
      ANILIST_GRAPHQL_URL,
      getMediaQuery,
      { id }
    );

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
