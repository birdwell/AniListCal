import { MediaFragmentFragment, MediaListStatus } from "@/generated/graphql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EpisodeControls } from "@/components/episode-controls";
import { StatusSelector } from "@/components/status-selector";
import { Calendar, PlayCircle, Clock, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProgressColor } from "@/lib/anime-utils";

interface EpisodeTrackingSectionProps {
  show: MediaFragmentFragment;
}

export function EpisodeTrackingSection({ show }: EpisodeTrackingSectionProps) {
  // Add debug logging
  console.log("Episode tracking data:", {
    mediaListEntry: show.mediaListEntry,
    episodes: show.episodes,
    nextAiringEpisode: show.nextAiringEpisode,
  });
  
  // @ts-ignore - We know mediaListEntry might not be in the type but it's in the data
  const currentEpisode = show.mediaListEntry?.progress || 0;
  const totalEpisodes = show.episodes || 0;
  const nextEpisodeNumber = show.nextAiringEpisode?.episode;

  const formatTimeUntilAiring = (timeUntilAiring: number) => {
    const days = Math.floor(timeUntilAiring / 86400);
    const hours = Math.floor((timeUntilAiring % 86400) / 3600);
    const minutes = Math.floor((timeUntilAiring % 3600) / 60);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  // If the user doesn't have this in their list, don't show the section
  // @ts-ignore - We know mediaListEntry might not be in the type but it's in the data
  if (!show.mediaListEntry) {
    console.log("No mediaListEntry available, not showing episode tracking section");
    return null;
  }

  return (
    <Card className="overflow-hidden border-t-4 border-t-primary">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Episode Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Status selector */}
        <div className="mb-4 pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium">Watch Status</h3>
            </div>
            <StatusSelector
              mediaId={show.id}
              currentStatus={show.mediaListEntry?.status || null}
              className="w-full sm:w-auto min-w-[180px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Your Progress
            </h3>

            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">
                <span
                  className={cn(
                    getProgressColor(
                      currentEpisode,
                      nextEpisodeNumber || totalEpisodes
                    )
                  )}
                >
                  {currentEpisode}
                </span>
                <span className="text-muted-foreground">
                  /{totalEpisodes || "?"}
                </span>
              </div>

              <EpisodeControls
                mediaId={show.id}
                currentEpisode={currentEpisode}
                totalEpisodes={totalEpisodes}
                targetEpisode={nextEpisodeNumber}
                variant="default"
                className="ml-2"
              />
            </div>

            {currentEpisode > 0 && totalEpisodes > 0 && (
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className={cn(
                    "h-full rounded-full",
                    getProgressColor(
                      currentEpisode,
                      nextEpisodeNumber || totalEpisodes
                    )
                  )}
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

          {show.nextAiringEpisode && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Next Episode
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    Episode {show.nextAiringEpisode.episode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    {formatTimeUntilAiring(
                      show.nextAiringEpisode.timeUntilAiring
                    )}
                  </span>
                </div>

                {currentEpisode < show.nextAiringEpisode.episode - 1 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-warning">
                      {show.nextAiringEpisode.episode - 1 - currentEpisode}{" "}
                      episode
                      {show.nextAiringEpisode.episode - 1 - currentEpisode > 1
                        ? "s"
                        : ""}{" "}
                      behind
                    </span>
                    <span> - catch up before the next episode airs!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
