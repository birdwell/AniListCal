import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { fetchUserAnime } from "@/lib/anilist";
import { logger } from "@/lib/logger";
import { LoadingView, ErrorAlert, AnimeContent } from "@/components/home";
import { commonQueryOptions } from "@/lib/query-config";
import { MediaListStatus } from "@/generated/graphql";
import { queryKeys } from "@/lib/queryKeys";

export default function Home() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getUser,
    ...commonQueryOptions,
  });

  const listStatuses = [
    MediaListStatus.Current,
    MediaListStatus.Paused,
    MediaListStatus.Planning,
  ];

  const {
    data: animeEntries,
    isLoading: isAnimeLoading,
    error: animeError,
  } = useQuery({
    queryKey: user?.id ? queryKeys.animeList(user.id, listStatuses) : ["disabled"],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("Please set your Anilist ID in your profile");
      }
      return fetchUserAnime(user.id, listStatuses);
    },
    enabled: !!user?.id,
    ...commonQueryOptions,
  });

  logger.debug(animeEntries);

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
        <AnimeContent animeEntries={animeEntries || []} />
      </div>
    </div>
  );
}
