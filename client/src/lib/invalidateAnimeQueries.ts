import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

/** Invalidate all persisted anime list and detail queries after a mutation. */
export function invalidateAnimeQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ["/anilist/anime"] });
}
