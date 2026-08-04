import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/home/SearchBar";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { useDebounce } from "@/hooks/useDebounce";
import { searchAnime } from "@/lib/anilist";
import { commonQueryOptions } from "@/lib/query-config";
import { queryKeys } from "@/lib/queryKeys";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const trimmedQuery = debouncedSearchQuery.trim();
  const isDebouncing =
    searchQuery.trim() !== trimmedQuery && searchQuery.trim() !== "";

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: queryKeys.animeSearch(trimmedQuery, 1),
    queryFn: () => searchAnime(trimmedQuery, 1),
    enabled: trimmedQuery.length > 0,
    ...commonQueryOptions,
  });

  const results = data?.media ?? [];
  const totalResults =
    trimmedQuery.length === 0
      ? null
      : (data?.pageInfo?.total ?? (isLoading || isDebouncing ? null : results.length));
  const showLoading = isDebouncing || (trimmedQuery.length > 0 && (isLoading || isFetching));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 sm:px-6 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalResults={totalResults}
        isLoading={showLoading}
      />

      <div className="pt-2">
        {trimmedQuery.length === 0 ? null : error ? (
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to search anime. Please try again."}
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
          </div>
        )}
      </div>
    </div>
  );
}
