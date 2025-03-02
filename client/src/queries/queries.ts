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
            native
          }
          format
          type
          status
          coverImage {
            large
          }
        }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 10) {
      nodes {
        id
        rating
        mediaRecommendation {
          id
          title {
            romaji
            english
            native
          }
          format
          type
          status
          coverImage {
            large
          }
        }
      }
    }
    externalLinks {
      id
      url
      site
      type
      icon
      color
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
  query GetUserMediaList($userId: Int!, $status: [MediaListStatus]) {
    MediaListCollection(userId: $userId, type: ANIME, status_in: $status) {
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

export const UPDATE_PROGRESS_MUTATION = gql`
  mutation UpdateMediaListProgress($mediaId: Int!, $progress: Int) {
    SaveMediaListEntry(mediaId: $mediaId, progress: $progress) {
      id
      mediaId
      status
      progress
      media {
        id
        title {
          romaji
          english
          native
        }
        episodes
      }
    }
  }
`;

export const UPDATE_STATUS_MUTATION = gql`
  mutation UpdateMediaListStatus($mediaId: Int!, $status: MediaListStatus) {
    SaveMediaListEntry(mediaId: $mediaId, status: $status) {
      id
      mediaId
      status
      progress
      media {
        id
        title {
          romaji
          english
          native
        }
        episodes
      }
    }
  }
`;
