import React from "react";
import { cn } from "@/lib/utils";
import { formatTimeUntil, formatTimeSince } from "@/lib/calendar-utils";
import { getAiringStatusColor } from "@/lib/anime-utils";

interface EpisodeInfoProps {
  shouldShowPreviousEpisode: boolean;
  displayEpisode: number;
  episode: number;
  previousEpisodeAiringAt: number;
  airingAt: number;
}

export function EpisodeInfo({
  shouldShowPreviousEpisode,
  displayEpisode,
  episode,
  previousEpisodeAiringAt,
  airingAt,
}: EpisodeInfoProps) {
  if (shouldShowPreviousEpisode) {
    return (
      <div className="min-w-0 space-y-1 font-data text-xs sm:text-sm">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-muted-foreground">Ep {displayEpisode}</span>
          <span className="truncate font-medium text-success">
            · Aired {formatTimeSince(previousEpisodeAiringAt)}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-muted-foreground">Ep {episode}</span>
          <span className={cn("truncate font-medium", getAiringStatusColor(airingAt))}>
            · {formatTimeUntil(airingAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5 font-data text-xs sm:text-sm">
      <span className="shrink-0 text-muted-foreground">Ep {episode}</span>
      <span className={cn("truncate font-medium", getAiringStatusColor(airingAt))}>
        · {formatTimeUntil(airingAt)}
      </span>
    </div>
  );
}
