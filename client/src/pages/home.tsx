import { useQuery } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime-card";
import { getUser } from "@/lib/auth";
import { fetchUserAnime } from "@/lib/anilist";
import { getRecommendations } from "@/lib/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-[2/3]">
            <Skeleton className="w-full h-full" />
          </div>
          <CardHeader className="p-4">
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export default function Home() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser
  });

  const { data: anime, isLoading: isLoadingAnime, error: animeError } = useQuery({
    queryKey: ["/anilist/anime", user?.sub],
    queryFn: () => {
      if (!user?.anilistId) {
        throw new Error("Please set your Anilist ID in your profile");
      }
      return fetchUserAnime(parseInt(user.anilistId));
    },
    enabled: !!user?.anilistId
  });

  const { data: recommendations, isLoading: isLoadingRecs } = useQuery({
    queryKey: ["/api/ai/recommendations", anime?.map(a => a.title.english)],
    queryFn: () => {
      if (!anime?.length) {
        throw new Error("No anime in watchlist");
      }
      return getRecommendations(anime.map(a => a.title.english || a.title.romaji));
    },
    enabled: !!anime?.length
  });

  if (isLoadingUser || isLoadingAnime) {
    return (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Currently Watching</h2>
          <LoadingGrid />
        </section>
      </div>
    );
  }

  if (!user?.anilistId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please set your Anilist ID in your profile to view your anime list.
        </AlertDescription>
      </Alert>
    );
  }

  if (animeError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to fetch your anime list. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const currentlyWatching = anime?.filter(a => a.status === "RELEASING") || [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Currently Watching</h2>
        {currentlyWatching.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {currentlyWatching.map(show => (
              <AnimeCard
                key={show.id}
                title={show.title.english || show.title.romaji}
                imageUrl={show.coverImage.large}
                status={show.status}
                nextEpisode={show.nextAiringEpisode}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No currently airing shows in your list.</p>
        )}
      </section>

      {recommendations && !isLoadingRecs && (
        <section>
          <h2 className="text-2xl font-bold mb-4">AI Recommendations</h2>
          <Card>
            <CardHeader>
              <CardTitle>Based on your watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg bg-accent">
                    <h3 className="font-bold">{rec.title}</h3>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}