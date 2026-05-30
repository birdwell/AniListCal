import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { fetchAuthenticatedAnimeDetails } from "@/lib/anilist";
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
import { queryKeys } from "@/lib/queryKeys";
import {
  selectDetailsOverviewData,
  selectDetailsStatusData,
  selectEpisodeTrackingData,
  selectHeroData,
  selectMetricsData,
  selectSeriesInfoData,
} from "@/components/show/types";

export default function ShowPage() {
  const { id } = useParams();
  const animeId = id ? parseInt(id) : undefined;

  const {
    data: show,
    isLoading,
    error,
  } = useQuery<MediaFragmentFragment>({
    queryKey: animeId ? queryKeys.animeDetail(animeId) : ["disabled"],
    queryFn: () => {
      if (!animeId || isNaN(animeId)) {
        throw new Error("Invalid anime ID");
      }
      return fetchAuthenticatedAnimeDetails(animeId);
    },
    enabled: !!animeId && !isNaN(animeId),
    refetchOnWindowFocus: true,
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

  const isInUserList = !!show.mediaListEntry;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl animate-in fade-in duration-500">
      <HeroSection {...selectHeroData(show)} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          {isInUserList ? (
            <EpisodeTrackingSection {...selectEpisodeTrackingData(show)} />
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

        <div className="md:col-span-2 space-y-8">
          <DetailsSection
            overview={selectDetailsOverviewData(show)}
            status={selectDetailsStatusData(show)}
            seriesInfo={selectSeriesInfoData(show)}
            metrics={selectMetricsData(show)}
            tags={show.tags}
            relations={show.relations}
          />
          {show.characters && <CharactersSection characters={show.characters} />}
          {show.externalLinks && (
            <ExternalLinksSection externalLinks={show.externalLinks} />
          )}
          {show.recommendations && (
            <RecommendationsSection recommendations={show.recommendations} />
          )}
        </div>
      </div>
    </div>
  );
}
