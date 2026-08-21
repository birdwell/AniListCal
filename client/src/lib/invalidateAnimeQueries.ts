import type { QueryClient } from "@tanstack/react-query";
import { revalidateActiveAnimeLists } from "./animeCache";

/** @deprecated Prefer the cache helpers in animeCache for mutation updates. */
export function invalidateAnimeQueries(queryClient: QueryClient): void {
  revalidateActiveAnimeLists(queryClient);
}
