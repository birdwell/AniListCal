import React from "react";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProgressColor } from "@/lib/anime-utils";

interface ProgressDisplayProps {
  currentEpisode: number;
  targetEpisode: number;
  totalEpisodes: number | null | undefined;
}

export function ProgressDisplay({
  currentEpisode,
  targetEpisode,
  totalEpisodes,
}: ProgressDisplayProps) {
  const progressColorClass = getProgressColor(currentEpisode, targetEpisode);

  return (
    <div className="flex items-center gap-2">
      <PlayCircle className={cn("h-4 w-4", progressColorClass)} />
      <span className={cn("whitespace-nowrap", progressColorClass)}>
        {currentEpisode} / {totalEpisodes || "?"}
      </span>
    </div>
  );
}
