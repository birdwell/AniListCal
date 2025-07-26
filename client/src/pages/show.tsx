import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  fetchAuthenticatedAnimeDetails,
} from "@/lib/anilist";
import { MediaFragmentFragment } from "@/generated/graphql";
import {
  LoadingSkeleton,
  HeroSection,
  DetailsSection,
  CharactersSection,
  ErrorDisplay,
  EpisodeTrackingSection,
} from "@/components/show";
import { AddToListButton } from "@/components/show/add-to-list-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListPlus } from "lucide-react";
import { RecommendationsSection } from "@/components/show/recommendations-section";
import { ExternalLinksSection } from "@/components/show/external-links-section";

export default function ShowPage() {
  const { id } = useParams();
  const animeId = id ? parseInt(id) : undefined;

  const {
    data: show,
    isLoading,
    error,
  } = useQuery<MediaFragmentFragment>({
    queryKey: ["/anilist/anime", animeId],
    queryFn: () => {
      if (!animeId || isNaN(animeId)) {
        throw new Error("Invalid anime ID");
      }
      return fetchAuthenticatedAnimeDetails(animeId);
    },
    enabled: !!animeId && !isNaN(animeId),
    // Refetch on window focus to get the latest status
    refetchOnWindowFocus: true,
    // Stale time of 0 means it will always check for updates
    staleTime: 0,
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
        <ErrorDisplay message={error?.message} />
      </div>
    );
  }

  // @ts-ignore - We know mediaListEntry might not be in the type but it's in the data
  const isInUserList = !!show.mediaListEntry;
  const coverImageSrc = show.coverImage?.extraLarge || show.coverImage?.large;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl animate-in fade-in duration-500">
      <HeroSection show={show} />

      {/* Reintroduce 2-column grid for tracking/add vs details */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column (for Tracking/Add Card) */}
        <div className="md:col-span-1 space-y-6">
          {isInUserList ? (
            <EpisodeTrackingSection show={show} />
          ) : (
            <Card className="overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="bg-muted/50 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListPlus className="h-5 w-5 text-primary" />
                  Add to Your List
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                  <p className="text-muted-foreground mb-2">
                    This anime is not in your list yet. Add it to track your
                    progress!
                  </p>
                  <AddToListButton mediaId={show.id} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (for Details, Characters, etc.) */}
        <div className="md:col-span-2 space-y-8"> {/* Changed back to md:col-span-2 */}
          {/* DetailsSection still gets coverImageSrc */}
          <DetailsSection show={show} coverImageSrc={coverImageSrc} />
          {show.characters && <CharactersSection show={show} />}
          {show.externalLinks && <ExternalLinksSection show={show} />}
          {show.recommendations && <RecommendationsSection show={show} />}
        </div>
      </div>
    </div>
  );
}
