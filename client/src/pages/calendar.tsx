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
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser
  });

  const { data: anime } = useQuery({
    queryKey: ["/anilist/anime", user?.sub],
    queryFn: () => fetchUserAnime(parseInt(user?.anilistId || "")),
    enabled: !!user?.anilistId
  });

  const airingDates = anime
    ?.filter(show => show.nextAiringEpisode)
    .reduce((acc, show) => {
      const date = new Date(show.nextAiringEpisode!.airingAt * 1000);
      const key = date.toISOString().split('T')[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        title: show.title.english || show.title.romaji,
        episode: show.nextAiringEpisode!.episode
      });
      return acc;
    }, {} as Record<string, Array<{ title: string; episode: number }>>);

  const filteredDates = Object.entries(airingDates || {}).filter(([date]) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === selectedDay;
  });

  return (
    <div className="space-y-6">
      {/* Day selector */}
      <Card className="overflow-x-auto">
        <CardContent className="p-4">
          <div className="flex gap-2 min-w-max">
            {DAYS.map((day, index) => (
              <Button
                key={day}
                variant={selectedDay === index ? "default" : "outline"}
                onClick={() => setSelectedDay(index)}
                className="px-4 py-2"
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <Card className="h-fit">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredDates.length > 0 ? (
            filteredDates.map(([date, shows]) => (
              <Card key={date}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">
                      {new Date(date).toLocaleDateString(undefined, { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {shows.map((show, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium">{show.title}</span>
                        <span className="text-sm text-muted-foreground">
                          Episode {show.episode}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No shows airing on {DAYS[selectedDay]}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}