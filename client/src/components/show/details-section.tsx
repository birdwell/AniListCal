import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Info, PlayCircle, AlignLeft, ImageOff } from "lucide-react";
import { TagsSection } from "./tags-section";
import { MetricsSection } from "./metrics-section";
import { SeriesInfoSection } from "./series-info-section";
import { RelationsSection } from "./relations-section";
import type {
  DetailsOverviewData,
  DetailsStatusData,
  MetricsSectionData,
  RelationsSectionData,
  SeriesInfoSectionData,
  TagsSectionData,
} from "./types";

interface DetailsSectionProps {
  overview: DetailsOverviewData;
  status: DetailsStatusData;
  seriesInfo: SeriesInfoSectionData;
  metrics: MetricsSectionData;
  tags: TagsSectionData["tags"];
  relations: RelationsSectionData["relations"];
}

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

function toTitleCase(str: string | null | undefined) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DetailsSection({
  overview,
  status,
  seriesInfo,
  metrics,
  tags,
  relations,
}: DetailsSectionProps) {
  const coverImageSrc =
    overview.coverImage?.extraLarge || overview.coverImage?.large;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlignLeft className="h-5 w-5 text-primary" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {coverImageSrc && (
              <div className="w-32 md:w-48 flex-shrink-0">
                <img
                  src={coverImageSrc}
                  alt={`${overview.title?.english || overview.title?.romaji || "Anime"} Cover`}
                  className="rounded-md object-cover w-full h-auto aspect-[2/3] bg-muted"
                />
              </div>
            )}
            {!coverImageSrc && (
              <div className="w-32 h-48 md:w-48 md:h-72 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                <ImageOff className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            <div className="flex-grow space-y-4">
              <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none">
                {overview.description && (
                  <div
                    dangerouslySetInnerHTML={{ __html: overview.description }}
                    className="text-foreground"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {overview.genres?.map((genre) =>
                  genre ? (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SeriesInfoSection {...seriesInfo} />
        <MetricsSection {...metrics} />
      </div>

      {tags && <TagsSection tags={tags} />}

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
            <span className="text-sm">Status: {toTitleCase(status.status)}</span>
          </div>
          {status.nextAiringEpisode && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Episode {status.nextAiringEpisode.episode} airing in{" "}
                {formatTimeUntilAiring(status.nextAiringEpisode.timeUntilAiring)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <PlayCircle className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Episodes: {status.episodes || "TBA"}
            </span>
          </div>
        </CardContent>
      </Card>

      {relations && <RelationsSection relations={relations} />}
    </div>
  );
}
