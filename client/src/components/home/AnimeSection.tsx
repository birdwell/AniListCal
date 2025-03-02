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
    <section className="bg-background rounded-lg border shadow-sm overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full">
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            role="button"
          >
            <h2 className="text-lg font-semibold">
              {title}
              {entries.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({entries.length})
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 pointer-events-none"
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0">
          {entries && entries.length > 0 ? (
            <div
              className={cn(
                isCompact
                  ? "space-y-3"
                  : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
              )}
            >
              {entries.map((entry) => (
                <AnimeCard
                  key={entry.media?.id}
                  entry={entry}
                  isCompact={isCompact}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No shows in {title.toLowerCase()}.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
