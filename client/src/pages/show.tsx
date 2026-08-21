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
import { DEFAULT_STALE_TIME } from "@/lib/query-config";
import { PageShell } from "@/components/ui/page-shell";
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
    refetchOnWindowFocus: false,
    staleTime: DEFAULT_STALE_TIME,
  });

  if (isLoading) {
    return (
      <PageShell>
        <LoadingSkeleton />
      </PageShell>
    );
  }

  if (error || !show) {
    return (
      <PageShell>
        <ErrorDisplay message={error?.message} />
      </PageShell>
    );
  }

  const isInUserList = !!show.mediaListEntry;

  return (
    <PageShell className="space-y-8">
      <HeroSection {...selectHeroData(show)} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-24">
          {isInUserList ? (
            <EpisodeTrackingSection {...selectEpisodeTrackingData(show)} />
          ) : (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListPlus className="h-5 w-5 text-primary" />
                  Add to your list
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-start gap-4 py-2">
                  <AddToListButton mediaId={show.id} />
                </div>
              </CardContent>
            </Card>
          )}
        </aside>

        <div className="min-w-0 space-y-8">
          <DetailsSection
            overview={selectDetailsOverviewData(show)}
            status={selectDetailsStatusData(show)}
            seriesInfo={selectSeriesInfoData(show)}
            metrics={selectMetricsData(show)}
            tags={show.tags}
            relations={show.relations}
            showStatus={!isInUserList}
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
    </PageShell>
  );
}
