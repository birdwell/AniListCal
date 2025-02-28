import { gql } from "graphql-request";

const MEDIA_FRAGMENT = gql`
  fragment MediaFragment on Media {
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
      }
    }
  }
`;

const ENTY_FRAGMENT = gql`
  fragment EntyFragment on MediaList {
    id
    status
    progress
    media {
      ...MediaFragment
    }
  }
  ${MEDIA_FRAGMENT}
`;

export const GET_USER_MEDIA_LIST_QUERY = gql`
  query GetUserMediaList($userId: Int!) {
    MediaListCollection(
      userId: $userId
      type: ANIME
      status_in: [CURRENT, PLANNING]
    ) {
      lists {
        entries {
          ...EntyFragment
        }
      }
    }
  }
  ${ENTY_FRAGMENT}
`;

export const GET_MEDIA_QUERY = gql`
  query GetMedia($id: Int!) {
    Media(id: $id, type: ANIME) {
      ...MediaFragment
    }
  }
  ${MEDIA_FRAGMENT}
`;
