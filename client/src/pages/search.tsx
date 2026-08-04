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
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 sm:px-6 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalResults={totalResults}
        isLoading={showSpinnerInBar}
      />

      <div className="pt-2">
        {liveQuery.length === 0 ? null : error ? (
          <p className="text-sm text-destructive">
            Failed to search anime. Please try again.
          </p>
        ) : isLoading || isDebouncing ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No results found.</p>
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
    </div>
  );
}
