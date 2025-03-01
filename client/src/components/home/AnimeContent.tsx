import { EntyFragmentFragment, MediaStatus } from "@/generated/graphql";
import { AnimeSection } from "./AnimeSection";
import { SearchBar } from "./SearchBar";
import { useMemo, useState } from "react";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { useDebounce } from "@/hooks/useDebounce";

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
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Determine if search is loading (when query changes but debounced query hasn't updated yet)
  const isSearching = searchQuery !== debouncedSearchQuery && searchQuery.trim() !== "";
  
  // Use our custom hook for fuzzy search
  const { filteredEntries } = useFuzzySearch(animeEntries, debouncedSearchQuery);
  
  // Apply filters with memoization for performance
  const filterAnimeByStatus = (status: Status) => {
    return filteredEntries?.filter(entry => entry.status === status) || [];
  };

  const currentlyAiring = useMemo(() => {
    return filteredEntries?.filter(entry => 
      entry.media?.status === MediaStatus.Releasing
    ) || [];
  }, [filteredEntries]);
  
  const watching = useMemo(() => filterAnimeByStatus("CURRENT"), [filterAnimeByStatus]);
  const onHold = useMemo(() => filterAnimeByStatus("PAUSED"), [filterAnimeByStatus]);
  const planned = useMemo(() => filterAnimeByStatus("PLANNING"), [filterAnimeByStatus]);

  // Calculate total results for display
  const totalResults = watching.length + onHold.length + planned.length + currentlyAiring.length;
  const hasSearchResults = debouncedSearchQuery.trim() !== "";
  
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
      <SearchBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        totalResults={hasSearchResults ? totalResults : null}
        isLoading={isSearching}
      />
      
      <AnimeSection 
        title="Currently Airing" 
        entries={currentlyAiring} 
        isOpen={sectionStates.airing}
        onToggle={() => toggleSection("airing")}
        isCompact={isCompact}
        count={currentlyAiring.length}
      />
      
      <AnimeSection 
        title="Watching" 
        entries={watching} 
        isOpen={sectionStates.watching}
        onToggle={() => toggleSection("watching")}
        isCompact={isCompact}
        count={watching.length}
      />
      
      <AnimeSection 
        title="On Hold" 
        entries={onHold} 
        isOpen={sectionStates.onHold}
        onToggle={() => toggleSection("onHold")}
        isCompact={isCompact}
        count={onHold.length}
      />
      
      <AnimeSection 
        title="Plan to Watch" 
        entries={planned} 
        isOpen={sectionStates.planned}
        onToggle={() => toggleSection("planned")}
        isCompact={isCompact}
        count={planned.length}
      />
    </>
  );
}
