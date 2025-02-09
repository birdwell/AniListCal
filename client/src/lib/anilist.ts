const ANILIST_API = "https://graphql.anilist.co";

export interface AnimeMedia {
  id: number;
  title: { romaji: string; english: string; native?: string };
  coverImage: { large: string; extraLarge?: string };
  status: string;
  episodes: number;
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
    timeUntilAiring: number;
  };
  mediaListEntry?: {
    progress: number;
    status: string;
  };
}

export interface AnimeDetails extends AnimeMedia {
  bannerImage?: string;
  description: string;
  genres: string[];
  averageScore: number;
  popularity: number;
  studios: {
    nodes: Array<{
      id: number;
      name: string;
    }>;
  };
  characters: {
    nodes: Array<{
      id: number;
      name: {
        full: string;
        native?: string;
      };
      image: {
        large: string;
      };
      role: string;
    }>;
  };
}

const MEDIA_QUERY = `
  query ($userId: Int) {
    MediaListCollection(userId: $userId, type: ANIME) {
      lists {
        entries {
          progress
          status
          media {
            id
            title {
              romaji
              english
            }
            coverImage {
              large
            }
            status
            episodes
            nextAiringEpisode {
              airingAt
              episode
              timeUntilAiring
            }
          }
        }
      }
    }
  }
`;

const ANIME_DETAILS_QUERY = `
  query ($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        extraLarge
      }
      bannerImage
      description(asHtml: false)
      status
      episodes
      nextAiringEpisode {
        airingAt
        episode
        timeUntilAiring
      }
      genres
      averageScore
      popularity
      studios {
        nodes {
          id
          name
        }
      }
      characters(sort: [ROLE, RELEVANCE], perPage: 12) {
        nodes {
          id
          name {
            full
            native
          }
          image {
            large
          }
          role
        }
      }
    }
  }
`;

export async function fetchUserAnime(userId: number): Promise<AnimeMedia[]> {
  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        query: MEDIA_QUERY,
        variables: { userId }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || "Failed to fetch from Anilist");
    }

    if (!data.data?.MediaListCollection?.lists) {
      throw new Error("Invalid response format from Anilist");
    }

    return data.data.MediaListCollection.lists.flatMap(
      (list: any) => list.entries.map((entry: any) => ({
        ...entry.media,
        mediaListEntry: {
          progress: entry.progress,
          status: entry.status
        }
      }))
    );
  } catch (error) {
    console.error("Error fetching user anime:", error);
    throw error;
  }
}

export async function fetchAnimeDetails(id: number): Promise<AnimeDetails> {
  try {
    if (!id || isNaN(id)) {
      throw new Error("Invalid anime ID provided");
    }

    console.log("Fetching anime details for ID:", id);

    const requestBody = {
      query: ANIME_DETAILS_QUERY,
      variables: { id }
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Response error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));

    if (data.errors) {
      const errorMessage = data.errors[0]?.message || "Failed to fetch anime details";
      console.error("Anilist API errors:", data.errors);
      throw new Error(errorMessage);
    }

    if (!data.data?.Media) {
      throw new Error("Anime not found");
    }

    return data.data.Media;
  } catch (error) {
    console.error("Error fetching anime details:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch anime details");
  }
}