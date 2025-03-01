import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { getProgressColor } from "@/lib/anime-utils";
import { format } from "date-fns";

interface AnimeCardProps {
  id: number;
  title: string;
  imageUrl: string;
  status: string;
  currentEpisode?: number;
  totalEpisodes?: number;
  nextEpisode?: {
    airingAt: number;
    episode: number;
  };
  isCompact?: boolean;
}

export function AnimeCard({
  id,
  title,
  imageUrl,
  status,
  currentEpisode,
  totalEpisodes,
  nextEpisode,
  isCompact = false,
}: AnimeCardProps) {
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
        <div className="flex gap-4 p-4">
          <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-md shadow-sm">
            <img
              src={imageUrl}
              alt={title}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex flex-col justify-center flex-grow min-w-0">
            <h3 className="font-medium text-base line-clamp-2 mb-2">{title}</h3>
            <div className="flex items-center gap-2">
              <PlayCircle
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  getProgressColor(currentEpisode || 0, nextEpisode?.episode)
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  getProgressColor(currentEpisode || 0, nextEpisode?.episode)
                )}
              >
                {currentEpisode || 0}
                {totalEpisodes && ` / ${totalEpisodes}`}
              </span>
            </div>
            {nextEpisode && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">
                  Episode {nextEpisode.episode} on{" "}
                  {formatDate(nextEpisode.airingAt)}
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
        <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm shadow-md">
          {status}
        </Badge>
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col gap-2 text-sm">
          {/* Episode Progress */}
          <div className="flex items-center gap-2">
            <PlayCircle
              className={cn(
                "h-5 w-5 flex-shrink-0",
                getProgressColor(currentEpisode || 0, nextEpisode?.episode)
              )}
            />
            <span
              className={cn(
                "font-medium",
                getProgressColor(currentEpisode || 0, nextEpisode?.episode)
              )}
            >
              Episode {currentEpisode || 0}
              {totalEpisodes && ` / ${totalEpisodes}`}
            </span>
          </div>
          {/* Next Episode Date */}
          {nextEpisode && (
            <div className="flex items-center gap-2 text-muted-foreground bg-accent/50 p-2 rounded-md mt-1">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              {nextEpisode.episode} on {formatDate(nextEpisode.airingAt)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
