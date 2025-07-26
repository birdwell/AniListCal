import { MediaFragmentFragment } from "@/generated/graphql";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Info, PlayCircle, Users, AlignLeft, ImageOff } from "lucide-react";
import { TagsSection } from "./tags-section";
import { MetricsSection } from "./metrics-section";
import { SeriesInfoSection } from "./series-info-section";
import { RelationsSection } from "./relations-section";

interface DetailsSectionProps {
  show: MediaFragmentFragment;
  coverImageSrc: string | null | undefined;
}

export function DetailsSection({ show, coverImageSrc }: DetailsSectionProps) {
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

  // Function to convert string to title case
  const toTitleCase = (str: string | null | undefined) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/_/g, " ") // Replace underscores if any
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlignLeft className="h-5 w-5 text-primary" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Container for image and text content */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Image Section */}
            {coverImageSrc && (
              <div className="w-32 md:w-48 flex-shrink-0">
                <img
                  src={coverImageSrc}
                  alt={`${show.title?.english || show.title?.romaji || "Anime"} Cover`}
                  className="rounded-md object-cover w-full h-auto aspect-[2/3] bg-muted"
                />
              </div>
            )}
            {!coverImageSrc && (
              <div className="w-32 h-48 md:w-48 md:h-72 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                <ImageOff className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Text Content Section */}
            <div className="flex-grow space-y-4">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid layout for the information sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SeriesInfoSection show={show} />
        <MetricsSection show={show} />
      </div>

      {/* Tags Section - Only render if tags exists */}
      {show.tags && <TagsSection show={show} />}

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
            <span className="text-sm">Status: {toTitleCase(show.status)}</span>
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
        </CardContent>
      </Card>


      {/* Relations Section - Only render if relations exists */}
      {show.relations && <RelationsSection show={show} />}
    </div>
  );
}
