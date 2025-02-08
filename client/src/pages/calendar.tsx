import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchUserAnime } from "@/lib/anilist";
import { getUser } from "@/lib/auth";
import { useState } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function CalendarPage() {
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(today);

  // Get ordered days starting from current day (fixed order)
  const orderedDays = DAYS.slice(today).concat(DAYS.slice(0, today));

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser
  });

  const { data: anime } = useQuery({
    queryKey: ["/anilist/anime", user?.sub],
    queryFn: () => fetchUserAnime(parseInt(user?.anilistId || "")),
    enabled: !!user?.anilistId
  });

  // Filter shows and group by date, only including future episodes
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  const airingDates = anime
    ?.filter(show => show.nextAiringEpisode)
    .reduce((acc, show) => {
      const date = new Date(show.nextAiringEpisode!.airingAt * 1000);
      if (date >= now) { // Only include future episodes
        const key = date.toISOString().split('T')[0];
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          title: show.title.english || show.title.romaji,
          episode: show.nextAiringEpisode!.episode,
          airingAt: show.nextAiringEpisode!.airingAt,
        });
      }
      return acc;
    }, {} as Record<string, Array<{ title: string; episode: number; airingAt: number }>>);

  const filteredDates = Object.entries(airingDates || {}).filter(([date]) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === selectedDay;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const suffix = ['th', 'st', 'nd', 'rd'][day % 10 - 1] || 'th';
    return {
      day: `${day}${suffix}`,
      weekday: DAYS[date.getDay()]
    };
  };

  return (
    <div className="space-y-6">
      {/* Day selector - fixed order based on current day */}
      <Card className="overflow-x-auto -mx-4 sm:mx-0 rounded-none sm:rounded-lg shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-2 min-w-max">
            {orderedDays.map((day, index) => {
              const dayIndex = (today + index) % 7;
              return (
                <Button
                  key={day}
                  variant={selectedDay === dayIndex ? "default" : "outline"}
                  onClick={() => setSelectedDay(dayIndex)}
                  className="px-3 sm:px-4 py-2"
                >
                  {window.innerWidth < 640 ? day.slice(0, 3) : day}
                </Button>
              );
            })}
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
            filteredDates.map(([date, shows]) => {
              const formattedDate = formatDate(date);
              return (
                <Card key={date}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold text-lg">
                          {formattedDate.weekday}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formattedDate.day}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {shows
                        .sort((a, b) => a.airingAt - b.airingAt)
                        .map((show, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                          >
                            <span className="font-medium line-clamp-2 sm:line-clamp-1">
                              {show.title}
                            </span>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              Episode {show.episode}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No upcoming episodes on {DAYS[selectedDay]}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}