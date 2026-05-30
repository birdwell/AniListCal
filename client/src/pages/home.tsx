import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { fetchUserAnime } from "@/lib/anilist";
import { logger } from "@/lib/logger";
import { LoadingView, ErrorAlert, AnimeContent } from "@/components/home";
import { commonQueryOptions } from "@/lib/query-config";
import { MediaListStatus } from "@/lib/mediaListStatus";
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
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 space-y-4 sm:space-y-6">
      <AnimeContent animeEntries={animeEntries || []} />
    </div>
  );
}
