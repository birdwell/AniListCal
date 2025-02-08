import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, PlayCircle, Filter } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUserAnime } from "@/lib/anilist";
import { getUser } from "@/lib/auth";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WATCH_STATUSES = ["CURRENT", "PLANNING"] as const;
type WatchStatus = typeof WATCH_STATUSES[number];

export default function CalendarPage() {
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(today);
  const [selectedStatuses, setSelectedStatuses] = useState<WatchStatus[]>(["CURRENT"]);

  // Get ordered days starting from current day (fixed order)
  const orderedDays = DAYS.slice(today).concat(DAYS.slice(0, today));

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  });

  const { data: anime, isLoading: isAnimeLoading } = useQuery({
    queryKey: ["/anilist/anime", user?.sub],
    queryFn: () => fetchUserAnime(parseInt(user?.anilistId || "")),
    enabled: !!user?.anilistId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  });

  const isLoading = isUserLoading || isAnimeLoading;

  const airingDates = anime
    ?.filter(show => 
      show.nextAiringEpisode && 
      show.mediaListEntry &&
      selectedStatuses.includes(show.mediaListEntry.status as WatchStatus)
    )
    .reduce((acc, show) => {
      const date = new Date(show.nextAiringEpisode!.airingAt * 1000);
      const key = date.toISOString().split('T')[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        title: show.title.english || show.title.romaji || "",
        episode: show.nextAiringEpisode!.episode,
        currentEpisode: show.mediaListEntry?.progress || 0,
        status: show.mediaListEntry?.status || ""
      });
      return acc;
    }, {} as Record<string, Array<{ 
      title: string; 
      episode: number;
      currentEpisode: number;
      status: string;
    }>>);

  const filteredDates = Object.entries(airingDates || {}).filter(([date]) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === selectedDay;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const suffix = ['th', 'st', 'nd', 'rd'][day % 10 - 1] || 'th';
    return `${DAYS[date.getDay()]}, ${day}${suffix}`;
  };

  const getProgressColor = (currentEp: number, nextEp: number) => {
    return currentEp < nextEp - 1
      ? "text-yellow-500 dark:text-yellow-400"
      : "text-green-500 dark:text-green-400";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
        <Card className="overflow-x-auto -mx-4 sm:mx-0 rounded-none sm:rounded-lg">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex gap-2 sm:gap-3 min-w-max">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          <Card className="hidden lg:block">
            <CardContent className="p-4">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <Skeleton key={j} className="h-20 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
      <Card className="overflow-x-auto -mx-4 sm:mx-0 rounded-none sm:rounded-lg">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex gap-2 sm:gap-3 min-w-max">
            {orderedDays.slice(0, 7).map((day, index) => {
              const dayIndex = (today + index) % 7;
              return (
                <Button
                  key={day}
                  variant={selectedDay === dayIndex ? "default" : "outline"}
                  onClick={() => setSelectedDay(dayIndex)}
                  className="px-3 sm:px-5 py-2 text-sm sm:text-base"
                >
                  {window.innerWidth < 640 ? day.slice(0, 3) : day}
                </Button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Show:</span>
            <div className="flex gap-2">
              {WATCH_STATUSES.map((status) => {
                const isSelected = selectedStatuses.includes(status);
                return (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 transition-colors",
                      isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "hover:text-foreground"
                    )}
                    onClick={() => {
                      setSelectedStatuses(prev => 
                        prev.includes(status)
                          ? prev.filter(s => s !== status)
                          : [...prev, status]
                      );
                    }}
                  >
                    {status === "CURRENT" ? "Watching" : "Plan to Watch"}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <Card className="hidden lg:block">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {filteredDates.length > 0 ? (
            filteredDates.map(([date, shows]) => (
              <Card key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">
                      {formatDate(date)}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {shows.map((show, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium line-clamp-2 sm:line-clamp-1">
                            {show.title}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {show.status === "CURRENT" ? "Watching" : "Plan to Watch"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <PlayCircle className={cn(
                              "h-4 w-4",
                              getProgressColor(show.currentEpisode, show.episode)
                            )} />
                            <span className={cn(
                              "whitespace-nowrap",
                              getProgressColor(show.currentEpisode, show.episode)
                            )}>
                              {show.currentEpisode} / {show.episode}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardContent className="p-6 text-center text-muted-foreground">
                No shows airing on {DAYS[selectedDay]}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}