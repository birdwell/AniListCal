import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { fetchUserAnime } from "@/lib/anilist";
import { useState } from "react";
import {
  LoadingView,
  ErrorAlert,
  ViewToggle,
  AnimeContent,
  SectionKey,
  SectionStates,
} from "@/components/home";
import { commonQueryOptions } from "@/lib/query-config";
import { MediaListStatus } from "@/generated/graphql";

type Status = "CURRENT" | "PAUSED" | "PLANNING";

export default function Home() {
  const [isCompact, setIsCompact] = useState(true);
  const [sectionStates, setSectionStates] = useState<SectionStates>({
    airing: true, // Set first section to be open by default
    watching: false,
    onHold: false,
    planned: false,
  });

  const toggleSection = (section: SectionKey) => {
    setSectionStates((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser,
    ...commonQueryOptions,
  });

  const {
    data: animeEntries,
    isLoading: isAnimeLoading,
    error: animeError,
  } = useQuery({
    queryKey: ["/anilist/anime", user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("Please set your Anilist ID in your profile");
      }
      return fetchUserAnime(user.id, [
        MediaListStatus.Current,
        MediaListStatus.Paused,
        MediaListStatus.Planning,
      ]);
    },
    enabled: !!user?.id,
    ...commonQueryOptions,
  });

  console.log(animeEntries);

  if (isLoadingUser || isAnimeLoading) {
    return <LoadingView />;
  }

  if (!user?.id) {
    return (
      <ErrorAlert message="Please set your Anilist ID in your profile to view your anime list." />
    );
  }

  if (animeError) {
    return (
      <ErrorAlert message="Failed to fetch your anime list. Please try again later." />
    );
  }

  return (
    <div className="flex justify-center w-full">
      <div className="space-y-4 sm:space-y-6 w-full px-3 sm:px-6 md:px-8 max-w-full sm:max-w-sm md:max-w-xl lg:max-w-4xl xl:max-w-6xl">
        <div className="sticky top-0 z-10 pt-2 pb-1 bg-background/80 backdrop-blur-sm">
          <ViewToggle
            isCompact={isCompact}
            onToggle={() => setIsCompact(!isCompact)}
          />
        </div>

        <AnimeContent
          animeEntries={animeEntries || []}
          sectionStates={sectionStates}
          toggleSection={toggleSection}
          isCompact={isCompact}
        />
      </div>
    </div>
  );
}
