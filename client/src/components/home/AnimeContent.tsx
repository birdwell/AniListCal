import { EntyFragmentFragment, MediaStatus } from "@/generated/graphql";
import { AnimeSection } from "./AnimeSection";

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
  const filterAnimeByStatus = (status: Status) => {
    return animeEntries?.filter(entry => entry.status === status) || [];
  };

  const currentlyAiring = animeEntries?.filter(entry => 
    entry.media?.status === MediaStatus.Releasing
  ) || [];
  
  const watching = filterAnimeByStatus("CURRENT");
  const onHold = filterAnimeByStatus("PAUSED");
  const planned = filterAnimeByStatus("PLANNING");

  return (
    <>
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
