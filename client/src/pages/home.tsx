import { useQuery } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime-card";
import { getUser } from "@/lib/auth";
import { fetchUserAnime } from "@/lib/anilist";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, ChevronUp, LayoutGrid, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function LoadingGrid() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex gap-4 p-4">
            <Skeleton className="h-24 w-16 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

type Status = "CURRENT" | "PAUSED" | "PLANNING";

export default function Home() {
  const [isCompact, setIsCompact] = useState(true);
  const [sectionStates, setSectionStates] = useState({
    airing: false,
    watching: false,
    onHold: false,
    planned: false
  });

  const toggleSection = (section: keyof typeof sectionStates) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser
  });

  const { data: anime, isLoading: isAnimeLoading, error: animeError } = useQuery({
    queryKey: ["/anilist/anime", user?.sub],
    queryFn: () => {
      if (!user?.anilistId) {
        throw new Error("Please set your Anilist ID in your profile");
      }
      return fetchUserAnime(parseInt(user.anilistId));
    },
    enabled: !!user?.anilistId
  });

  if (isLoadingUser || isAnimeLoading) {
    return (
      <div className="space-y-4 container mx-auto px-4 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-base font-medium mb-2">Your Anime</h2>
          <LoadingGrid />
        </section>
      </div>
    );
  }

  if (!user?.anilistId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please set your Anilist ID in your profile to view your anime list.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (animeError) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to fetch your anime list. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filterAnimeByStatus = (status: Status) => {
    return anime?.filter(show => show.mediaListEntry?.status === status) || [];
  };

  const currentlyAiring = anime?.filter(show => show.status === "RELEASING") || [];
  const watching = filterAnimeByStatus("CURRENT");
  const onHold = filterAnimeByStatus("PAUSED");
  const planned = filterAnimeByStatus("PLANNING");

  const renderSection = (
    title: string,
    shows: typeof anime,
    stateKey: keyof typeof sectionStates
  ) => (
    <section key={title}>
      <Collapsible
        open={sectionStates[stateKey]}
        onOpenChange={() => toggleSection(stateKey)}
        className="space-y-1"
      >
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center justify-between py-1 cursor-pointer hover:text-primary transition-colors"
            role="button"
          >
            <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 pointer-events-none">
              {sectionStates[stateKey] ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {shows && shows.length > 0 ? (
            <div className={cn(
              isCompact
                ? "space-y-2"
                : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
            )}>
              {shows.map(show => (
                <AnimeCard
                  key={show.id}
                  id={show.id}
                  title={show.title.english || show.title.romaji}
                  imageUrl={show.coverImage.large}
                  status={show.status}
                  currentEpisode={show.mediaListEntry?.progress}
                  totalEpisodes={show.episodes}
                  nextEpisode={show.nextAiringEpisode}
                  isCompact={isCompact}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No shows in {title.toLowerCase()}.</p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );

  return (
    <div className="space-y-4 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCompact(!isCompact)}
          title={isCompact ? "Grid View" : "List View"}
        >
          {isCompact ? (
            <LayoutGrid className="h-4 w-4" />
          ) : (
            <LayoutList className="h-4 w-4" />
          )}
        </Button>
      </div>

      {renderSection("Currently Airing", currentlyAiring, "airing")}
      {renderSection("Watching", watching, "watching")}
      {renderSection("On Hold", onHold, "onHold")}
      {renderSection("Plan to Watch", planned, "planned")}
    </div>
  );
}