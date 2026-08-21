import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/home/SearchBar";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { searchAnime } from "@/lib/anilist";
import { commonQueryOptions } from "@/lib/query-config";
import { queryKeys } from "@/lib/queryKeys";
import { Loader2 } from "lucide-react";
import { AppState } from "@/components/app-state";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const liveQuery = searchQuery.trim();
  // Clear immediately when the input is empty so stale results don't linger
  // for the debounce window.
  const debouncedSearchQuery = useDebounce(liveQuery, 300);
  const trimmedQuery = liveQuery.length === 0 ? "" : debouncedSearchQuery;
  const isDebouncing = liveQuery.length > 0 && liveQuery !== trimmedQuery;

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: queryKeys.animeSearch(trimmedQuery),
    queryFn: ({ pageParam }) => searchAnime(trimmedQuery, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pageInfo?.hasNextPage) {
        return undefined;
      }
      return (lastPage.pageInfo.currentPage ?? 1) + 1;
    },
    enabled: trimmedQuery.length > 0,
    ...commonQueryOptions,
  });

  const results = data?.pages.flatMap((page) => page.media) ?? [];
  const totalResults =
    liveQuery.length === 0
      ? null
      : (data?.pages[0]?.pageInfo?.total ??
        (isLoading || isDebouncing ? null : results.length));
  const showSpinnerInBar =
    isDebouncing ||
    (trimmedQuery.length > 0 && isFetching && !isFetchingNextPage);

  return (
    <PageShell size="narrow" className="space-y-6">
      <PageHeader title="Search" />

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalResults={totalResults}
        isLoading={showSpinnerInBar}
      />

      <div className="pt-2">
        {liveQuery.length === 0 ? (
          <AppState
            kind="empty"
            title="Find a show"
            description="Search by English, romaji, or native title."
          />
        ) : error ? (
          <AppState
            kind="error"
            title="Search could not be completed"
            description="Try again in a moment."
          />
        ) : isLoading || isDebouncing ? (
          <AppState kind="loading" title="Searching AniList" />
        ) : results.length === 0 ? (
          <AppState
            kind="empty"
            title="No matches"
            description="Try another title or spelling."
          />
        ) : (
          <div>
            {results.map((media) =>
              media ? <SearchResultRow key={media.id} media={media} /> : null
            )}
            {hasNextPage ? (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    void fetchNextPage();
                  }}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </PageShell>
  );
}
