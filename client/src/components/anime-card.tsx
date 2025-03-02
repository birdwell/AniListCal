import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { getProgressColor } from "@/lib/anime-utils";
import { format } from "date-fns";
import { EpisodeControls } from "@/components/episode-controls";
import { EntyFragmentFragment, MediaStatus } from "@/generated/graphql";

interface AnimeCardProps {
  entry: EntyFragmentFragment;
  isCompact?: boolean;
}

export function AnimeCard({ entry, isCompact = false }: AnimeCardProps) {
  // Extract data from entry
  const id = entry.media?.id || 0;
  const title =
    entry.media?.title?.english || entry.media?.title?.romaji || "Unknown";
  const imageUrl = isCompact
    ? entry.media?.coverImage?.large ?? ""
    : entry.media?.coverImage?.extraLarge || "";
  const status = entry.media?.status || "";
  const currentEpisode = entry.progress || 0;
  const totalEpisodes = entry.media?.episodes || 0;
  const nextEpisode = entry.media?.nextAiringEpisode;
  const [, setLocation] = useLocation();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    // Format with short weekday name (e.g., "Mon", "Tue") and day with ordinal suffix
    const dayOfMonth = date.getDate();
    const suffix = ["th", "st", "nd", "rd"][
      dayOfMonth % 10 > 0 &&
      dayOfMonth % 10 < 4 &&
      (dayOfMonth < 11 || dayOfMonth > 13)
        ? dayOfMonth % 10
        : 0
    ];

    // Use date-fns for short weekday format
    const shortWeekday = format(date, "EEE"); // 'EEE' gives short weekday name

    return `${shortWeekday}, ${dayOfMonth}${suffix}`;
  };

  const handleClick = () => {
    setLocation(`/show/${id}`);
  };

  if (isCompact) {
    return (
      <Card
        className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-primary/70"
        onClick={handleClick}
      >
        <div className="flex gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="h-20 w-14 sm:h-24 sm:w-16 flex-shrink-0 overflow-hidden rounded-md shadow-sm">
            <img
              src={imageUrl}
              alt={title}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-1 sm:mb-2">
              {title}
            </h3>
            <div className="flex items-start">
              <EpisodeControls
                mediaId={id}
                currentEpisode={currentEpisode}
                totalEpisodes={totalEpisodes}
                compact={true}
                variant="pill"
                targetEpisode={nextEpisode?.episode}
                className="flex-shrink-0"
              />
            </div>
            {nextEpisode && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="line-clamp-1">
                  Ep {nextEpisode.episode} on {formatDate(nextEpisode.airingAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full cursor-pointer border-0"
      onClick={handleClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <Badge className="absolute top-1 sm:top-2 right-1 sm:right-2 text-xs sm:text-sm bg-primary/90 backdrop-blur-sm shadow-md">
          {status}
        </Badge>
      </div>
      <CardHeader className="p-2 sm:p-4">
        <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 pt-0">
        <div className="flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm">
          {/* Episode Progress */}
          <div className="flex items-start">
            <EpisodeControls
              mediaId={id}
              currentEpisode={currentEpisode}
              totalEpisodes={totalEpisodes}
              targetEpisode={nextEpisode?.episode}
              compact={true}
              variant="default"
              className="flex-shrink-0"
            />
          </div>
          {/* Next Episode Date */}
          {nextEpisode && (
            <div className="inline-flex items-center flex-shrink-0 gap-1 sm:gap-2 text-muted-foreground bg-accent/50 p-1 sm:p-2 rounded-md mt-1 text-xs sm:text-sm whitespace-nowrap">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="line-clamp-1 whitespace-normal">
                Ep {nextEpisode.episode} on {formatDate(nextEpisode.airingAt)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
