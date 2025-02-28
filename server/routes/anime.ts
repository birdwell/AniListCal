import type { Express } from "express";
import { request, gql } from "graphql-request";
import {
  EntyFragmentFragment,
  UserAnimeListQuery,
  UserAnimeListQueryVariables,
} from "../generated/graphql";
import { ANILIST_GRAPHQL_URL } from "../constants";

export function registerAnimeRoutes(app: Express) {
  app.get("/api/anime/airing", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user;

      const query = gql`
        query UserAnimeList($userId: Int!) {
          MediaListCollection(
            userId: $userId
            type: ANIME
            status_in: [CURRENT, PLANNING]
          ) {
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
      `;

      const variables: UserAnimeListQueryVariables = {
        userId: parseInt(user.id),
      };

      const data = await request<UserAnimeListQuery>(
        ANILIST_GRAPHQL_URL,
        query,
        variables,
        {
          Authorization: `Bearer ${user.accessToken}`,
        }
      );

      const entries: EntyFragmentFragment[] = [];
      const lists = data?.MediaListCollection?.lists ?? [];

      if (lists) {
        for (const list of lists) {
          for (const entry of list?.entries ?? []) {
            if (entry?.media != null) {
              entries.push(entry);
            }
          }
        }
      }

      res.json(entries);
    } catch (error) {
      console.error("Error fetching airing anime:", error);
      res.status(500).json({ error: "Failed to fetch airing anime" });
    }
  });
}
