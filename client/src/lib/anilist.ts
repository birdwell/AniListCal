const ANILIST_API = "https://graphql.anilist.co";

export interface AnimeMedia {
  id: number;
  title: { romaji: string; english: string; native?: string };
  coverImage: { large: string };
  status: string;
  episodes: number;
  nextAiringEpisode?: { airingAt: number; episode: number };
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
      description
      status
      episodes
      nextAiringEpisode {
        airingAt
        episode
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
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: MEDIA_QUERY,
      variables: { userId }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch from Anilist");
  }

  const data = await response.json();
  return data.data.MediaListCollection.lists.flatMap(
    (list: any) => list.entries.map((entry: any) => ({
      ...entry.media,
      mediaListEntry: {
        progress: entry.progress,
        status: entry.status
      }
    }))
  );
}

export async function fetchAnimeDetails(id: number): Promise<AnimeDetails> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: ANIME_DETAILS_QUERY,
      variables: { id }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch anime details from Anilist");
  }

  const data = await response.json();
  return data.data.Media;
}