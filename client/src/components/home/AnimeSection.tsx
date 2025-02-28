import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntyFragmentFragment } from "@/generated/graphql";
import { AnimeCard } from "@/components/anime-card";
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
  return (
    <section>
      <Collapsible open={isOpen} onOpenChange={onToggle} className="space-y-1">
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center justify-between py-1 cursor-pointer hover:text-primary transition-colors"
            role="button"
          >
            <h2 className="text-sm font-medium text-muted-foreground">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 pointer-events-none"
            >
              {isOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {entries && entries.length > 0 ? (
            <div
              className={cn(
                isCompact
                  ? "space-y-2"
                  : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
              )}
            >
              {entries.map((entry) => (
                <AnimeCard
                  key={entry.media?.id}
                  id={entry.media?.id || 0}
                  title={
                    entry.media?.title?.english ||
                    entry.media?.title?.romaji ||
                    "Unknown"
                  }
                  imageUrl={
                    isCompact
                      ? entry.media?.coverImage?.large ?? ""
                      : entry.media?.coverImage?.extraLarge || ""
                  }
                  status={entry.media?.status || ""}
                  currentEpisode={entry.progress || 0}
                  totalEpisodes={entry.media?.episodes || undefined}
                  nextEpisode={entry.media?.nextAiringEpisode || undefined}
                  isCompact={isCompact}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No shows in {title.toLowerCase()}.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
