import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { fetchUserAnime } from "@/lib/anilist";
import { logger } from "@/lib/logger";
import { AnimeContent } from "@/components/home";
import { commonQueryOptions } from "@/lib/query-config";
import { MediaListStatus } from "@/generated/graphql";
import { queryKeys } from "@/lib/queryKeys";
import { AppState } from "@/components/app-state";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

const currentStatuses = [MediaListStatus.Current];
const libraryStatuses = [
  MediaListStatus.Paused,
  MediaListStatus.Planning,
];

export default function Home() {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getUser,
    ...commonQueryOptions,
  });

  const currentAnime = useQuery({
    queryKey: user?.id ? queryKeys.animeList(user.id, currentStatuses) : ["disabled"],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("Please set your Anilist ID in your profile");
      }
      return fetchUserAnime(user.id, currentStatuses);
    },
    enabled: !!user?.id,
    ...commonQueryOptions,
  });

  const libraryAnime = useQuery({
    queryKey: user?.id ? queryKeys.animeList(user.id, libraryStatuses) : ["disabled"],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("Please set your Anilist ID in your profile");
      }
      return fetchUserAnime(user.id, libraryStatuses);
    },
    enabled: !!user?.id && currentAnime.isSuccess,
    ...commonQueryOptions,
  });

  const animeEntries = [
    ...(currentAnime.data ?? []),
    ...(libraryAnime.data ?? []),
  ];

  logger.debug(animeEntries);

  if (isLoadingUser || currentAnime.isLoading) {
    return (
      <PageShell size="wide" className="space-y-6">
        <PageHeader title="Today" />
        <AppState kind="loading" title="Loading your anime" />
      </PageShell>
    );
  }

  if (!user?.id) {
    return (
      <PageShell size="wide" className="space-y-6">
        <PageHeader title="Today" />
        <AppState
          kind="error"
          title="AniList account unavailable"
          description="Reconnect your AniList account to load your anime list."
        />
      </PageShell>
    );
  }

  if (currentAnime.error) {
    return (
      <PageShell size="wide" className="space-y-6">
        <PageHeader title="Today" />
        <AppState
          kind="error"
          title="Your anime list could not be loaded"
          description="Try again in a moment."
        />
      </PageShell>
    );
  }

  if (!animeEntries.length && !libraryAnime.isLoading) {
    return (
      <PageShell size="wide" className="space-y-6">
        <PageHeader title="Today" />
        <AppState
          kind="empty"
          title="Your anime list is empty"
          description="Add a show on AniList, then return here to track it."
        />
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" className="space-y-6">
      <PageHeader title="Today" />
      <AnimeContent animeEntries={animeEntries} />
    </PageShell>
  );
}
