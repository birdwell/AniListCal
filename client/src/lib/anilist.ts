const ANILIST_API = "https://graphql.anilist.co";

export interface AnimeMedia {
  id: number;
  title: { romaji: string; english: string };
  coverImage: { large: string };
  status: string;
  nextAiringEpisode?: { airingAt: number; episode: number };
}

const MEDIA_QUERY = `
  query ($userId: Int) {
    MediaListCollection(userId: $userId, type: ANIME) {
      lists {
        entries {
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
    (list: any) => list.entries.map((entry: any) => entry.media)
  );
}
