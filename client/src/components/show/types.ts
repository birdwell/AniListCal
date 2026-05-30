import type { MediaFragmentFragment } from "@/generated/graphql";

export type HeroSectionData = Pick<
  MediaFragmentFragment,
  "title" | "bannerImage" | "coverImage"
>;

export type EpisodeTrackingSectionData = Pick<
  MediaFragmentFragment,
  "id" | "episodes" | "nextAiringEpisode" | "mediaListEntry"
>;

export type CharactersSectionData = Pick<MediaFragmentFragment, "characters">;

export type ExternalLinksSectionData = Pick<
  MediaFragmentFragment,
  "externalLinks"
>;

export type RecommendationsSectionData = Pick<
  MediaFragmentFragment,
  "recommendations"
>;

export type TagsSectionData = Pick<MediaFragmentFragment, "tags">;

export type SeriesInfoSectionData = Pick<
  MediaFragmentFragment,
  | "format"
  | "episodes"
  | "duration"
  | "season"
  | "seasonYear"
  | "source"
  | "countryOfOrigin"
  | "isAdult"
  | "startDate"
  | "endDate"
  | "studios"
>;

export type MetricsSectionData = Pick<
  MediaFragmentFragment,
  "averageScore" | "meanScore" | "popularity" | "favourites" | "rankings"
>;

export type RelationsSectionData = Pick<MediaFragmentFragment, "relations">;

export type DetailsOverviewData = Pick<
  MediaFragmentFragment,
  "title" | "description" | "genres" | "coverImage"
>;

export type DetailsStatusData = Pick<
  MediaFragmentFragment,
  "status" | "episodes" | "nextAiringEpisode"
>;

export function selectHeroData(show: MediaFragmentFragment): HeroSectionData {
  return {
    title: show.title,
    bannerImage: show.bannerImage,
    coverImage: show.coverImage,
  };
}

export function selectEpisodeTrackingData(
  show: MediaFragmentFragment
): EpisodeTrackingSectionData {
  return {
    id: show.id,
    episodes: show.episodes,
    nextAiringEpisode: show.nextAiringEpisode,
    mediaListEntry: show.mediaListEntry,
  };
}

export function selectDetailsOverviewData(
  show: MediaFragmentFragment
): DetailsOverviewData {
  return {
    title: show.title,
    description: show.description,
    genres: show.genres,
    coverImage: show.coverImage,
  };
}

export function selectDetailsStatusData(
  show: MediaFragmentFragment
): DetailsStatusData {
  return {
    status: show.status,
    episodes: show.episodes,
    nextAiringEpisode: show.nextAiringEpisode,
  };
}

export function selectSeriesInfoData(
  show: MediaFragmentFragment
): SeriesInfoSectionData {
  return {
    format: show.format,
    episodes: show.episodes,
    duration: show.duration,
    season: show.season,
    seasonYear: show.seasonYear,
    source: show.source,
    countryOfOrigin: show.countryOfOrigin,
    isAdult: show.isAdult,
    startDate: show.startDate,
    endDate: show.endDate,
    studios: show.studios,
  };
}

export function selectMetricsData(show: MediaFragmentFragment): MetricsSectionData {
  return {
    averageScore: show.averageScore,
    meanScore: show.meanScore,
    popularity: show.popularity,
    favourites: show.favourites,
    rankings: show.rankings,
  };
}
