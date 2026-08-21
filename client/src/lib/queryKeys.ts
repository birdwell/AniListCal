import type { MediaListStatus } from "@/generated/graphql";

export const queryKeys = {
  authUser: ["auth", "user"] as const,
  anime: ["/anilist/anime"] as const,
  animeLists: () => ["/anilist/anime", "list"] as const,
  animeList: (userId: number, status: MediaListStatus[]) =>
    ["/anilist/anime", "list", userId, [...status].sort().join(",")] as const,
  animeDetails: () => ["/anilist/anime", "detail"] as const,
  animeDetail: (mediaId: number) =>
    ["/anilist/anime", "detail", mediaId] as const,
  animeSearches: () => ["/anilist/anime", "search"] as const,
  animeSearch: (search: string) =>
    ["/anilist/anime", "search", search] as const,
};
