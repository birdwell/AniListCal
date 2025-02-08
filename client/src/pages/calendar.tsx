import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { fetchUserAnime } from "@/lib/anilist";
import { getUser } from "@/lib/auth";

export default function CalendarPage() {
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

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-8">
      <Card>
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={new Date()}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {Object.entries(airingDates || {}).map(([date, shows]) => (
          <Card key={date}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">
                  {new Date(date).toLocaleDateString()}
                </h3>
              </div>
              <div className="space-y-2">
                {shows.map((show, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-accent flex justify-between items-center"
                  >
                    <span>{show.title}</span>
                    <span className="text-sm text-muted-foreground">
                      Episode {show.episode}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
