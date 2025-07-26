import { EntyFragmentFragment, MediaStatus } from "@/generated/graphql";
import { AnimeSection } from "./AnimeSection";
import { SearchBar } from "./SearchBar";
import { useMemo, useState } from "react";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilterStore } from "@/stores/filterStore";
import { TagFilter } from "./TagFilter";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type SectionKey = "airing" | "watching" | "onHold" | "planned";

export interface SectionStates {
  airing: boolean;
  watching: boolean;
  onHold: boolean;
  planned: boolean;
}

interface AnimeContentProps {
  animeEntries: EntyFragmentFragment[];
  sectionStates: SectionStates;
  toggleSection: (section: SectionKey) => void;
  isCompact: boolean;
}

type Status = "CURRENT" | "PAUSED" | "PLANNING";

export function AnimeContent({
  animeEntries,
  sectionStates,
  toggleSection,
  isCompact
}: AnimeContentProps) {
  // State for controlling the tag filter collapsible section
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);

  // Use Zustand store for search query and selected tags
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const selectedTags = useFilterStore((state) => state.selectedTags);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Determine if search is loading (when query changes but debounced query hasn't updated yet)
  const isSearching = searchQuery !== debouncedSearchQuery && searchQuery.trim() !== "";

  // Use our custom hook for fuzzy search
  const { filteredEntries } = useFuzzySearch(animeEntries, debouncedSearchQuery);

  // Calculate unique list of all available tags and genres, categorized
  const categorizedTags = useMemo(() => {
    const categories: Record<string, Set<string>> = {};

    animeEntries?.forEach(entry => {
      // Add Genres
      if (entry.media?.genres && entry.media.genres.length > 0) {
        if (!categories["Genre"]) {
          categories["Genre"] = new Set<string>();
        }
        entry.media.genres.forEach(genre => {
          if (genre) categories["Genre"].add(genre);
        });
      }

      // Add Tags by Category
      entry.media?.tags?.forEach(tag => {
        if (tag?.name && tag.category) {
          if (!categories[tag.category]) {
            categories[tag.category] = new Set<string>();
          }
          categories[tag.category].add(tag.name);
        }
      });
    });

    // Convert sets to sorted arrays and sort categories
    const sortedCategorizedTags: Record<string, string[]> = {};
    Object.keys(categories)
      .sort() // Sort category names
      .forEach(category => {
        sortedCategorizedTags[category] = Array.from(categories[category]).sort(); // Sort tags within category
      });

    return sortedCategorizedTags;
  }, [animeEntries]);

  // Apply combined search and tag filters
  const filteredAndTaggedEntries = useMemo(() => {
    // Start with fuzzy search results
    let results = filteredEntries;

    // Apply tag filter if any tags are selected
    if (selectedTags.length > 0) {
      results = results?.filter(entry => {
        const entryTags = new Set<string>([
          ...(entry.media?.genres?.filter(Boolean) as string[] || []),
          ...(entry.media?.tags?.map(t => t?.name).filter(Boolean) as string[] || [])
        ]);
        // Check if all selected tags are present in the entry's tags
        return selectedTags.every(tag => entryTags.has(tag));
      });
    }

    return results;
  }, [filteredEntries, selectedTags]);

  // Apply status filters *after* search and tag filters
  const filterAnimeByStatus = (status: Status) => {
    return filteredAndTaggedEntries?.filter(entry => entry.status === status) || [];
  };

  const currentlyAiring = useMemo(() => {
    return filteredAndTaggedEntries?.filter(entry =>
      entry.media?.status === MediaStatus.Releasing
    ) || [];
  }, [filteredAndTaggedEntries]);

  const watching = useMemo(() => filterAnimeByStatus("CURRENT"), [filterAnimeByStatus]);
  const onHold = useMemo(() => filterAnimeByStatus("PAUSED"), [filterAnimeByStatus]);
  const planned = useMemo(() => filterAnimeByStatus("PLANNING"), [filterAnimeByStatus]);

  // Calculate total results for display (based on filtered + tagged)
  const totalResults = filteredAndTaggedEntries?.length ?? 0;
  const hasSearchResults = debouncedSearchQuery.trim() !== "" || selectedTags.length > 0;

  // Auto-expand sections when searching
  useMemo(() => {
    if (hasSearchResults && totalResults > 0) {
      // Only auto-expand sections if we have search results and they're not already open
      const sectionsToExpand: Record<SectionKey, boolean> = {
        airing: currentlyAiring.length > 0 && !sectionStates.airing,
        watching: watching.length > 0 && !sectionStates.watching,
        onHold: onHold.length > 0 && !sectionStates.onHold,
        planned: planned.length > 0 && !sectionStates.planned
      };

      // Expand sections with results
      Object.entries(sectionsToExpand).forEach(([section, shouldExpand]) => {
        if (shouldExpand) {
          toggleSection(section as SectionKey);
        }
      });
    }
  }, [debouncedSearchQuery, totalResults, currentlyAiring.length, watching.length, onHold.length, planned.length, sectionStates, toggleSection]);

  return (
    <>
      <div className="mb-4">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalResults={hasSearchResults ? totalResults : null}
          isLoading={isSearching}
        />
      </div>

      <Collapsible open={isTagFilterOpen} onOpenChange={setIsTagFilterOpen} className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Filters</h3>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative data-[state=open]:bg-accent"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {selectedTags.length > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 p-0 flex items-center justify-center text-[10px] rounded-full"
                >
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <TagFilter categorizedTags={categorizedTags} />
        </CollapsibleContent>
      </Collapsible>

      <AnimeSection
        title="Currently Airing"
        entries={currentlyAiring}
        isOpen={sectionStates.airing}
        onToggle={() => toggleSection("airing")}
        isCompact={isCompact}
      />

      <AnimeSection
        title="Watching"
        entries={watching}
        isOpen={sectionStates.watching}
        onToggle={() => toggleSection("watching")}
        isCompact={isCompact}
      />

      <AnimeSection
        title="On Hold"
        entries={onHold}
        isOpen={sectionStates.onHold}
        onToggle={() => toggleSection("onHold")}
        isCompact={isCompact}
      />

      <AnimeSection
        title="Plan to Watch"
        entries={planned}
        isOpen={sectionStates.planned}
        onToggle={() => toggleSection("planned")}
        isCompact={isCompact}
      />
    </>
  );
}

