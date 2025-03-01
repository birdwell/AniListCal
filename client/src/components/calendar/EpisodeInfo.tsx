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
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Episode {displayEpisode}</span>
          <span className="font-medium text-green-500 dark:text-green-400">
            • Aired {formatTimeSince(previousEpisodeAiringAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Episode {episode} (next)</span>
          <span className={cn("font-medium", getAiringStatusColor(airingAt))}>
            • {formatTimeUntil(airingAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Episode {episode}</span>
      <span className={cn("font-medium", getAiringStatusColor(airingAt))}>
        • {formatTimeUntil(airingAt)}
      </span>
    </div>
  );
}
