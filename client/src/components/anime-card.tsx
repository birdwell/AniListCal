import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { EpisodeControls } from "@/components/episode-controls";
import { EntyFragmentFragment } from "@/generated/graphql";

interface AnimeCardProps {
  entry: EntyFragmentFragment;
  isCompact?: boolean;
  priority?: boolean;
}

export function AnimeCard({
  entry,
  isCompact = false,
  priority = false,
}: AnimeCardProps) {
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

  if (isCompact) {
    return (
      <article>
        <Card className="group relative overflow-hidden bg-muted/45 ring-0 transition-colors hover:bg-muted/70 hover:shadow-md">
          <Link
            href={`/show/${id}`}
            aria-label={`View ${title}`}
            className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          />
          <div className="flex w-full gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-16">
              <img
                src={imageUrl}
                alt={title}
                width="128"
                height="192"
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={priority ? "high" : "auto"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex h-8 items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold leading-5 group-hover:text-primary sm:text-base">
                  {title}
                </h3>
                <ChevronRight
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                {nextEpisode && (
                  <div className="flex min-w-0 items-center gap-1.5 font-data text-xs text-muted-foreground sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                    <span className="truncate">
                      Ep {nextEpisode.episode} · {formatDate(nextEpisode.airingAt)}
                    </span>
                  </div>
                )}
                <div className="relative z-20 ml-auto flex-shrink-0">
                  <EpisodeControls
                    mediaId={id}
                    currentEpisode={currentEpisode}
                    totalEpisodes={totalEpisodes}
                    compact
                    variant="pill"
                    targetEpisode={nextEpisode?.episode}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </article>
    );
  }

  return (
    <article className="h-full">
    <Card className="group relative h-full overflow-hidden transition-colors hover:bg-accent/35 hover:shadow-md">
      <Link
        href={`/show/${id}`}
        aria-label={`View ${title}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      />
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          width="300"
          height="450"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
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
          <div className="relative z-20 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm">
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
    </article>
  );
}
