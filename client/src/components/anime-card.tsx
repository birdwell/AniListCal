import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

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
  isCompact = false
}: AnimeCardProps) {
  const [, setLocation] = useLocation();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric'
    }).replace(/(\d+)$/, (_, num) => {
      const suffix = ['th', 'st', 'nd', 'rd'];
      const lastDigit = num % 10;
      return num + (suffix[lastDigit] || suffix[0]);
    });
  };

  const getProgressColor = () => {
    if (!currentEpisode || !nextEpisode) return "text-muted-foreground";
    return currentEpisode < nextEpisode.episode - 1 
      ? "text-yellow-500 dark:text-yellow-400"
      : "text-green-500 dark:text-green-400";
  };

  const handleClick = () => {
    setLocation(`/show/${id}`);
  };

  if (isCompact) {
    return (
      <Card 
        className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex gap-4 p-4">
          <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-sm">
            <img
              src={imageUrl}
              alt={title}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex flex-col justify-center flex-grow min-w-0">
            <h3 className="font-medium line-clamp-1 mb-2">{title}</h3>
            <div className="flex items-center gap-2">
              <PlayCircle className={cn("h-4 w-4 flex-shrink-0", getProgressColor())} />
              <span className={cn("text-sm", getProgressColor())}>
                {currentEpisode || 0}{totalEpisodes && ` / ${totalEpisodes}`}
              </span>
            </div>
            {nextEpisode && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">
                  Episode {nextEpisode.episode} on {formatDate(nextEpisode.airingAt)}
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
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full cursor-pointer"
      onClick={handleClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm">
          {status}
        </Badge>
      </div>
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="flex flex-col gap-1 text-sm">
          {/* Episode Progress */}
          <div className="flex items-center gap-2">
            <PlayCircle className={cn("h-4 w-4 flex-shrink-0", getProgressColor())} />
            <span className={cn("font-medium", getProgressColor())}>
              Episode {currentEpisode || 0}
              {totalEpisodes && ` / ${totalEpisodes}`}
            </span>
          </div>
          {/* Next Episode Date */}
          {nextEpisode && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">
                Episode {nextEpisode.episode} on {formatDate(nextEpisode.airingAt)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}