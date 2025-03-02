import { MediaFragmentFragment } from "@/generated/graphql";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Info, PlayCircle, Users, AlignLeft } from "lucide-react";
import { EpisodeControls } from "@/components/episode-controls";
import { TagsSection } from "./tags-section";
import { MetricsSection } from "./metrics-section";
import { SeriesInfoSection } from "./series-info-section";
import { RelationsSection } from "./relations-section";

interface DetailsSectionProps {
  show: MediaFragmentFragment;
}

export function DetailsSection({ show }: DetailsSectionProps) {
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

  // Function to safely render HTML content
  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  return (
    <div className="space-y-6">
      {/* Description and Genres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlignLeft className="h-5 w-5 text-primary" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-6">
          <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none">
            {show.description && (
              <div
                dangerouslySetInnerHTML={createMarkup(show.description)}
                className="text-foreground"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {show.genres?.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center gap-3">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm">Status: {show.status}</span>
          </div>
          {show.nextAiringEpisode && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Episode {show.nextAiringEpisode.episode} airing in{" "}
                {formatTimeUntilAiring(show.nextAiringEpisode.timeUntilAiring)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <PlayCircle className="h-4 w-4 text-primary" />
            <span className="text-sm">Episodes: {show.episodes || "TBA"}</span>
          </div>
          {/* @ts-ignore - We know mediaListEntry might not be in the type but it's in the data */}
          {show.mediaListEntry && (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 flex items-center justify-center text-primary">
                📺
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Progress:</span>
                <EpisodeControls
                  mediaId={show.id}
                  currentEpisode={show.mediaListEntry.progress || 0}
                  totalEpisodes={show.episodes || 0}
                  compact
                  variant="minimal"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid layout for the information sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SeriesInfoSection show={show} />
        <MetricsSection show={show} />
      </div>

      {/* Tags Section - Only render if tags exists */}
      {show.tags && <TagsSection show={show} />}

      {/* Relations Section - Only render if relations exists */}
      {show.relations && <RelationsSection show={show} />}
    </div>
  );
}
