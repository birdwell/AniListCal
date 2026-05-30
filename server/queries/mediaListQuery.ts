/**
 * Server-side GraphQL query for prefetching user media lists.
 * Mirrors client/src/queries/queries.ts GetUserMediaList.
 */
export const GET_USER_MEDIA_LIST_QUERY = `
  query GetUserMediaList($userId: Int!, $status: [MediaListStatus]) {
    MediaListCollection(userId: $userId, type: ANIME, status_in: $status) {
      lists {
        entries {
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
            bannerImage
            description(asHtml: false)
            status
            episodes
            duration
            season
            seasonYear
            format
            source
            countryOfOrigin
            isAdult
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            nextAiringEpisode {
              airingAt
              episode
              timeUntilAiring
            }
            genres
            tags {
              id
              name
              description
              category
              rank
              isGeneralSpoiler
              isMediaSpoiler
            }
            averageScore
            meanScore
            popularity
            favourites
            rankings {
              id
              rank
              type
              format
              year
              season
              allTime
              context
            }
            mediaListEntry {
              id
              status
              progress
            }
            studios {
              nodes {
                id
                name
              }
            }
            relations {
              edges {
                id
                relationType
                node {
                  id
                  title {
                    romaji
                    english
                  }
                  coverImage {
                    large
                  }
                  type
                  format
                  status
                }
              }
            }
            recommendations {
              nodes {
                mediaRecommendation {
                  id
                  title {
                    romaji
                    english
                  }
                  coverImage {
                    large
                  }
                  format
                  averageScore
                }
              }
            }
            externalLinks {
              id
              url
              site
              type
              language
              color
              icon
            }
            characters {
              edges {
                id
                role
                node {
                  id
                  name {
                    full
                  }
                  image {
                    large
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/** Status sets the client commonly requests — prefetch on login. */
export const PREFETCH_LIST_STATUS_SETS: string[][] = [
  ["CURRENT", "PAUSED", "PLANNING"],
  ["CURRENT"],
];
