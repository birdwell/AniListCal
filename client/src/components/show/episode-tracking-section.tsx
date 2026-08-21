import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EpisodeControls } from "@/components/episode-controls";
import { StatusSelector } from "@/components/status-selector";
import { Calendar, Clock, ListChecks } from "lucide-react";
import type { EpisodeTrackingSectionData } from "./types";

function formatTimeUntilAiring(timeUntilAiring: number) {
  const days = Math.floor(timeUntilAiring / 86400);
  const hours = Math.floor((timeUntilAiring % 86400) / 3600);
  const minutes = Math.floor((timeUntilAiring % 3600) / 60);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

export function EpisodeTrackingSection({
  id: mediaId,
  episodes,
  nextAiringEpisode,
  mediaListEntry,
}: EpisodeTrackingSectionData) {
  if (!mediaListEntry) {
    return null;
  }

  const currentEpisode = mediaListEntry.progress || 0;
  const totalEpisodes = episodes || 0;
  const nextEpisodeNumber = nextAiringEpisode?.episode;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <h2 className="font-display text-xl font-semibold">Your progress</h2>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium">Watch status</h3>
            </div>
            <StatusSelector
              mediaId={mediaId}
              currentStatus={mediaListEntry.status || null}
              className="w-full sm:w-auto min-w-[180px]"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-data text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Episodes
              </span>
              <EpisodeControls
                mediaId={mediaId}
                currentEpisode={currentEpisode}
                totalEpisodes={totalEpisodes}
                targetEpisode={nextEpisodeNumber}
                variant="minimal"
                className="flex-shrink-0"
              />
            </div>

            {currentEpisode > 0 && totalEpisodes > 0 && (
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Episodes watched"
                aria-valuemin={0}
                aria-valuemax={totalEpisodes}
                aria-valuenow={currentEpisode}
              >
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-150"
                  style={{
                    width: `${Math.min(
                      100,
                      (currentEpisode / totalEpisodes) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            )}
          </div>

          {nextAiringEpisode && (
            <div className="border-l-2 border-l-live pl-4">
              <h3 className="font-data text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Next episode
              </h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-data font-medium">
                    Episode {nextAiringEpisode.episode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-data text-sm">
                    {formatTimeUntilAiring(nextAiringEpisode.timeUntilAiring)}
                  </span>
                </div>

                {currentEpisode < nextAiringEpisode.episode - 1 && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-data font-medium text-warning">
                      {nextAiringEpisode.episode - 1 - currentEpisode} episode
                      {nextAiringEpisode.episode - 1 - currentEpisode > 1
                        ? "s"
                        : ""}{" "}
                      behind
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
