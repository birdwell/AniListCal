/**
 * Canonical user media list query, shared by the client (list fetch) and the
 * server (login/session-restore prefetch).
 *
 * The proxy cache key is a hash of the exact query text + variables, so both
 * sides MUST send the identical string for prefetched responses to be served.
 * Import from here instead of duplicating the query.
 *
 * Deliberately slim: only the fields the home and calendar views render.
 * The show page fetches full media details separately via GetMedia.
 */
export const GET_USER_MEDIA_LIST_QUERY = `
  fragment EntyFragment on MediaList {
    id
    status
    progress
    media {
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
      status
      episodes
      nextAiringEpisode {
        airingAt
        episode
      }
      genres
      tags {
        name
        category
      }
      studios {
        nodes {
          id
          name
        }
      }
    }
  }

  query GetUserMediaList($userId: Int!, $status: [MediaListStatus]) {
    MediaListCollection(userId: $userId, type: ANIME, status_in: $status) {
      lists {
        entries {
          ...EntyFragment
        }
      }
    }
  }
`;

/**
 * Status sets the client requests on load — home sends the first, calendar
 * the second. Order and casing must match the client's variables exactly.
 */
export const PREFETCH_LIST_STATUS_SETS: string[][] = [
  ["CURRENT", "PAUSED", "PLANNING"],
  ["CURRENT"],
];
