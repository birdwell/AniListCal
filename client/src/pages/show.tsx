import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { getUser } from "@/lib/auth";
import { fetchAnimeDetails } from "@/lib/anilist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, Calendar, Info, Users } from "lucide-react";
import { cn } from "@/lib/utils";

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section Skeleton */}
      <div className="relative h-[300px] md:h-[400px] -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
        <Skeleton className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>

      {/* Details Section Skeleton */}
      <div className="grid md:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Characters Section Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Characters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShowPage() {
  const { id } = useParams();
  const animeId = id ? parseInt(id) : undefined;

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser
  });

  const { data: show, isLoading, error } = useQuery({
    queryKey: ["/anilist/anime", animeId],
    queryFn: () => {
      if (!animeId || isNaN(animeId)) {
        throw new Error("Invalid anime ID");
      }
      return fetchAnimeDetails(animeId);
    },
    enabled: !!animeId && !isNaN(animeId)
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {error?.message || "Show not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTimeUntilAiring = (timeUntilAiring: number) => {
    const days = Math.floor(timeUntilAiring / 86400);
    const hours = Math.floor((timeUntilAiring % 86400) / 3600);
    const minutes = Math.floor((timeUntilAiring % 3600) / 60);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
        <img
          src={show.bannerImage || show.coverImage.large}
          alt={show.title.english || show.title.romaji}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {show.title.english || show.title.romaji}
          </h1>
          {show.title.native && (
            <p className="text-lg text-muted-foreground">
              {show.title.native}
            </p>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="grid md:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <p className="text-muted-foreground whitespace-pre-line">
            {show.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {show.genres.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Status: {show.status}
              </span>
            </div>
            {show.nextAiringEpisode && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Episode {show.nextAiringEpisode.episode} airing in {formatTimeUntilAiring(show.nextAiringEpisode.timeUntilAiring)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <PlayCircle className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Episodes: {show.episodes || "TBA"}
              </span>
            </div>
            {show.studios?.nodes?.[0] && (
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Studio: {show.studios.nodes[0].name}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Characters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Characters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {show.characters?.nodes?.map((character) => (
              <div key={character.id} className="space-y-2">
                <div className="aspect-[3/4] rounded-lg overflow-hidden">
                  <img
                    src={character.image.large}
                    alt={character.name.full}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium line-clamp-1">
                    {character.name.full}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {character.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}