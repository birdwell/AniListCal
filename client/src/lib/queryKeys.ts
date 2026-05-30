import type { MediaListStatus } from "@/lib/mediaListStatus";

export const queryKeys = {
  authUser: ["auth", "user"] as const,
  animeList: (userId: number, status: MediaListStatus[]) =>
    ["/anilist/anime", "list", userId, [...status].sort().join(",")] as const,
  animeDetail: (mediaId: number) =>
    ["/anilist/anime", "detail", mediaId] as const,
};
