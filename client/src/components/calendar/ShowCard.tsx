import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntyFragmentFragment } from "@/generated/graphql";
import {
  formatTimeUntil,
  formatTimeSince,
  isWeeklyShow,
} from "@/lib/calendar-utils";
import { getAiringStatusColor, getProgressColor } from "@/lib/anime-utils";
import { useLocation } from "wouter";

interface ShowCardProps {
  entry: EntyFragmentFragment;
}

export function ShowCard({ entry }: ShowCardProps) {
  const [, navigate] = useLocation();

  if (!entry.media?.nextAiringEpisode) return null;

  const title =
    entry.media.title?.english || entry.media.title?.romaji || "Unknown Title";
  const episode = entry.media.nextAiringEpisode.episode;
  const currentEpisode = entry.progress || 0;
  const totalEpisodes = entry.media.episodes;
  const airingAt = entry.media.nextAiringEpisode.airingAt;
  const coverImage =
    entry.media.coverImage?.large || entry.media.coverImage?.extraLarge;

  // Get current date information
  const now = new Date();
  const airingDate = new Date(airingAt * 1000);

  // Check if this is today's date
  const isToday =
    now.getDate() === airingDate.getDate() &&
    now.getMonth() === airingDate.getMonth() &&
    now.getFullYear() === airingDate.getFullYear();

  // Check if this is a weekly show (same day of week as today, within next week)
  const isShowWeekly = isWeeklyShow(airingAt);

  // Determine if we should show the previous episode
  const shouldShowPreviousEpisode = isToday || isShowWeekly;

  // For today's shows or weekly shows, we'll display the previous episode
  const displayEpisode = shouldShowPreviousEpisode ? episode - 1 : episode;

  // Calculate the previous episode's airing time (approximately 7 days ago)
  const previousEpisodeAiringAt = airingAt - 7 * 24 * 60 * 60;

  const handleClick = () => {
    if (entry.media?.id) {
      navigate(`/show/${entry.media.id}`);
    }
  };

  return (
    <div
      className="p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex gap-3 items-center">
          {coverImage && (
            <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
              <img
                src={coverImage}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="space-y-1">
            <span className="font-medium line-clamp-2 sm:line-clamp-1">
              {title}
            </span>
            {shouldShowPreviousEpisode ? (
              // For shows where we're displaying the previous episode
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Episode {displayEpisode}
                  </span>
                  <span className="font-medium text-green-500 dark:text-green-400">
                    • Aired {formatTimeSince(previousEpisodeAiringAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Episode {episode} (next)
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      getAiringStatusColor(airingAt)
                    )}
                  >
                    • {formatTimeUntil(airingAt)}
                  </span>
                </div>
              </div>
            ) : (
              // For regular upcoming episodes
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Episode {episode}</span>
                <span
                  className={cn("font-medium", getAiringStatusColor(airingAt))}
                >
                  • {formatTimeUntil(airingAt)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <PlayCircle
              className={cn(
                "h-4 w-4",
                getProgressColor(
                  currentEpisode,
                  shouldShowPreviousEpisode ? episode - 1 : episode
                )
              )}
            />
            <span
              className={cn(
                "whitespace-nowrap",
                getProgressColor(
                  currentEpisode,
                  shouldShowPreviousEpisode ? episode - 1 : episode
                )
              )}
            >
              {currentEpisode} / {totalEpisodes || "?"}
              {shouldShowPreviousEpisode && currentEpisode < episode - 1 && (
                <span className="ml-1 text-xs text-yellow-500 dark:text-yellow-400">
                  (need to catch up)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
