import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntyFragmentFragment } from "@/generated/graphql";
import { formatTimeUntil, getAiringStatusColor, getProgressColor } from "@/lib/calendar-utils";

interface ShowCardProps {
  entry: EntyFragmentFragment;
}

export function ShowCard({ entry }: ShowCardProps) {
  if (!entry.media?.nextAiringEpisode) return null;
  
  const title = entry.media.title?.english || entry.media.title?.romaji || "Unknown Title";
  const episode = entry.media.nextAiringEpisode.episode;
  const currentEpisode = entry.progress || 0;
  const totalEpisodes = entry.media.episodes;
  const airingAt = entry.media.nextAiringEpisode.airingAt;
  
  return (
    <div className="p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="space-y-1">
          <span className="font-medium line-clamp-2 sm:line-clamp-1">
            {title}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Episode {episode}
            </span>
            <span className={cn("font-medium", getAiringStatusColor(airingAt))}>
              • {formatTimeUntil(airingAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <PlayCircle className={cn(
              "h-4 w-4",
              getProgressColor(currentEpisode, totalEpisodes)
            )} />
            <span className={cn(
              "whitespace-nowrap",
              getProgressColor(currentEpisode, totalEpisodes)
            )}>
              {currentEpisode} / {totalEpisodes || '?'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
