import type { Express } from "express";

// Interface for airing anime shows
interface AiringShow {
  id: number;
  title: string;
  status: string;
  episodes?: number;
  mediaListEntry?: {
    status: string;
    progress: number;
  };
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
    timeUntilAiring: number;
  };
}

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

export function registerAnimeRoutes(app: Express) {
  // Get current user's airing anime
  app.get("/api/anime/airing", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user;

      // Query AniList API for user's anime list
      const response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          query: `
            query {
              MediaListCollection(userId: ${user.id}, type: ANIME, status_in: [CURRENT, PLANNING]) {
                lists {
                  status
                  entries {
                    id
                    status
                    progress
                    media {
                      id
                      title {
                        english
                        romaji
                      }
                      episodes
                      status
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
          `,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch anime list");
      }

      const data = await response.json();

      // Process the data to match the format the client expects
      const processedData = {
        type: "airing_update",
        data: [] as AiringShow[],
      };

      // Extract and transform the data
      if (data?.data?.MediaListCollection?.lists) {
        const allEntries = [];
        for (const list of data.data.MediaListCollection.lists) {
          for (const entry of list.entries) {
            if (entry.media) {
              allEntries.push({
                id: entry.media.id,
                title: entry.media.title.english || entry.media.title.romaji,
                status: entry.media.status,
                episodes: entry.media.episodes,
                mediaListEntry: {
                  status: entry.status,
                  progress: entry.progress,
                },
                nextAiringEpisode: entry.media.nextAiringEpisode,
              });
            }
          }
        }
        processedData.data = allEntries;
      }

      res.json(processedData);
    } catch (error) {
      console.error("Error fetching airing anime:", error);
      res.status(500).json({ error: "Failed to fetch airing anime" });
    }
  });
}
