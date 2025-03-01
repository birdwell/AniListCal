import { useMemo } from 'react';
import { EntyFragmentFragment } from '@/generated/graphql';

/**
 * A custom hook that provides optimized fuzzy search functionality for anime entries
 * @param entries The array of anime entries to search through
 * @param searchQuery The search query string
 * @returns An object containing filtered entries and search stats
 */
export function useFuzzySearch(
  entries: EntyFragmentFragment[] | undefined,
  searchQuery: string
) {
  // Memoized search function for performance
  const searchFunction = useMemo(() => {
    return (entry: EntyFragmentFragment, query: string): boolean => {
      if (!query.trim()) return true;
      
      const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const title = entry.media?.title;
      
      // Combine all title variants for searching
      const titleStr = [
        title?.english,
        title?.romaji,
        title?.native
      ].filter(Boolean).join(" ").toLowerCase();
      
      // Include genres in search
      const genres = entry.media?.genres?.filter(Boolean).join(" ").toLowerCase() || "";
      
      // Include studio names in search
      const studios = entry.media?.studios?.nodes
        ?.filter(Boolean)
        .map(studio => studio?.name)
        .filter(Boolean)
        .join(" ")
        .toLowerCase() || "";
      
      // Combine all searchable text
      const searchableText = `${titleStr} ${genres} ${studios}`;
      
      // Check if all search terms are found in the searchable text
      return searchTerms.every(term => searchableText.includes(term));
    };
  }, []);
  
  // Apply filtering with memoization
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!searchQuery.trim()) return entries;
    
    const startTime = performance.now();
    const results = entries.filter(entry => searchFunction(entry, searchQuery));
    const endTime = performance.now();
    
    return results;
  }, [entries, searchQuery, searchFunction]);
  
  // Calculate search stats
  const stats = useMemo(() => {
    return {
      totalResults: filteredEntries.length,
      hasResults: filteredEntries.length > 0,
      isEmpty: searchQuery.trim() === "",
    };
  }, [filteredEntries, searchQuery]);
  
  return {
    filteredEntries,
    stats
  };
}
