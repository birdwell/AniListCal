import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";
import type {
  EntyFragmentFragment,
  MediaFragmentFragment,
  MediaListStatus,
} from "@/generated/graphql";
import type { SearchMediaPage } from "@/lib/anilist";
import { queryKeys } from "@/lib/queryKeys";

export interface MediaListEntryPatch {
  entryId?: number;
  progress?: number;
  status?: MediaListStatus | null;
}

export type AnimeCacheSnapshot = Array<readonly [QueryKey, unknown]>;
type SearchCacheData =
  | SearchMediaPage
  | InfiniteData<SearchMediaPage, number>;

function patchListEntry(
  entry: EntyFragmentFragment,
  mediaId: number,
  patch: MediaListEntryPatch,
): EntyFragmentFragment {
  if (entry.media?.id !== mediaId) return entry;

  return {
    ...entry,
    ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
  };
}

function patchDetail(
  detail: MediaFragmentFragment | undefined,
  mediaId: number,
  patch: MediaListEntryPatch,
): MediaFragmentFragment | undefined {
  if (!detail || detail.id !== mediaId) return detail;

  const currentEntry = detail.mediaListEntry;
  return {
    ...detail,
    mediaListEntry: {
      id: patch.entryId ?? currentEntry?.id ?? -mediaId,
      progress: patch.progress ?? currentEntry?.progress ?? 0,
      status:
        patch.status !== undefined ? patch.status : currentEntry?.status ?? null,
    },
  };
}

function patchSearchPage(
  page: SearchMediaPage | undefined,
  mediaId: number,
  patch: MediaListEntryPatch,
): SearchMediaPage | undefined {
  if (!page || !Array.isArray(page.media)) return page;

  return {
    ...page,
    media: page.media.map((media) => {
      if (!media || media.id !== mediaId) return media;

      const currentEntry = media.mediaListEntry;
      return {
        ...media,
        mediaListEntry: {
          id: patch.entryId ?? currentEntry?.id ?? -mediaId,
          progress: patch.progress ?? currentEntry?.progress ?? 0,
          status:
            patch.status !== undefined
              ? patch.status
              : currentEntry?.status ?? null,
        },
      };
    }),
  };
}

function patchSearchCache(
  data: SearchCacheData | undefined,
  mediaId: number,
  patch: MediaListEntryPatch,
): SearchCacheData | undefined {
  if (!data) return data;

  if ("media" in data) {
    return patchSearchPage(data, mediaId, patch);
  }

  if (Array.isArray(data.pages)) {
    return {
      ...data,
      pages: data.pages.map(
        (page) => patchSearchPage(page, mediaId, patch) ?? page,
      ),
    };
  }

  return data;
}

/** Capture only the anime caches a list-entry mutation can change. */
export function snapshotAnimeEntryCaches(
  queryClient: QueryClient,
  mediaId: number,
): AnimeCacheSnapshot {
  return [
    ...queryClient.getQueriesData({ queryKey: queryKeys.animeLists() }),
    ...queryClient.getQueriesData({
      queryKey: queryKeys.animeDetail(mediaId),
      exact: true,
    }),
    ...queryClient.getQueriesData({ queryKey: queryKeys.animeSearches() }),
  ];
}

export async function cancelAnimeEntryQueries(
  queryClient: QueryClient,
  mediaId: number,
): Promise<void> {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: queryKeys.animeLists() }),
    queryClient.cancelQueries({
      queryKey: queryKeys.animeDetail(mediaId),
      exact: true,
    }),
    queryClient.cancelQueries({ queryKey: queryKeys.animeSearches() }),
  ]);
}

/** Apply the mutation response consistently without invalidating unrelated data. */
export function patchAnimeEntryCaches(
  queryClient: QueryClient,
  mediaId: number,
  patch: MediaListEntryPatch,
): void {
  queryClient.setQueriesData<EntyFragmentFragment[]>(
    { queryKey: queryKeys.animeLists() },
    (entries) => entries?.map((entry) => patchListEntry(entry, mediaId, patch)),
  );

  queryClient.setQueryData<MediaFragmentFragment>(
    queryKeys.animeDetail(mediaId),
    (detail) => patchDetail(detail, mediaId, patch),
  );

  queryClient.setQueriesData<SearchCacheData>(
    { queryKey: queryKeys.animeSearches() },
    (data) => patchSearchCache(data, mediaId, patch),
  );
}

export function restoreAnimeEntryCaches(
  queryClient: QueryClient,
  snapshot: AnimeCacheSnapshot,
): void {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

/** Membership and server-derived list fields are refreshed, while detail/search stay warm. */
export function revalidateActiveAnimeLists(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.animeLists(),
    refetchType: "active",
  });
}
