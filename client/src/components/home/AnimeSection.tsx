import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntyFragmentFragment } from "@/generated/graphql";
import { AnimeCard } from "@/components/anime-card";
import { compareEntriesByWatchProgress } from "@/lib/anime-utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AnimeSectionProps {
  title: string;
  entries: EntyFragmentFragment[];
  isOpen: boolean;
  onToggle: () => void;
  isCompact: boolean;
}

export function AnimeSection({
  title,
  entries,
  isOpen,
  onToggle,
  isCompact,
}: AnimeSectionProps) {
  const sortedEntries = [...entries].sort(compareEntriesByWatchProgress);

  return (
    <section className="overflow-hidden rounded-xl bg-card">
      <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-h-14 w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition-colors hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <h2 className="font-display text-lg font-semibold">
              {title}
              {sortedEntries.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({sortedEntries.length})
                </span>
              )}
            </h2>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          {sortedEntries.length > 0 ? (
            <div
              className={cn(
                isCompact
                  ? "grid grid-cols-1 gap-3 lg:grid-cols-2"
                  : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6"
              )}
            >
              {sortedEntries.map((entry) => (
                <AnimeCard
                  key={entry.media?.id}
                  entry={entry}
                  isCompact={isCompact}
                />
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              No shows in {title.toLowerCase()}.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
