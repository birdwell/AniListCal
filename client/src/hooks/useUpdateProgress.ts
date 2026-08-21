import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryAniList } from '../lib/anilistProxy';
import { logger } from '../lib/logger';
import { UPDATE_PROGRESS_MUTATION } from '@/queries/queries';
import { toast } from '@/hooks/use-toast';
import { MediaListStatus } from '@/generated/graphql';
import {
  cancelAnimeEntryQueries,
  patchAnimeEntryCaches,
  revalidateActiveAnimeLists,
  restoreAnimeEntryCaches,
  snapshotAnimeEntryCaches,
} from '@/lib/animeCache';

interface UpdateProgressVariables {
  mediaId: number;
  progress: number;
}

interface SaveMediaListEntryResult {
  SaveMediaListEntry?: {
    id?: number | null;
    media?: {
      title: { romaji?: string | null; english?: string | null };
    };
    progress?: number | null;
    status?: MediaListStatus | null;
  };
}

/**
 * Custom hook for updating episode progress for an anime
 * @returns Mutation functions and state for updating episode progress
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async ({ mediaId, progress }: UpdateProgressVariables) => {
      return queryAniList<SaveMediaListEntryResult>(UPDATE_PROGRESS_MUTATION, {
        mediaId,
        progress,
      });
    },
    onMutate: async ({ mediaId, progress }) => {
      await cancelAnimeEntryQueries(queryClient, mediaId);
      const snapshot = snapshotAnimeEntryCaches(queryClient, mediaId);

      patchAnimeEntryCaches(queryClient, mediaId, { progress });
      return { snapshot };
    },
    onSuccess: (data, { mediaId }) => {
      const updatedEntry = data?.data?.SaveMediaListEntry;
      const updatedMedia = data?.data?.SaveMediaListEntry?.media;
      const updatedProgress = data?.data?.SaveMediaListEntry?.progress;

      patchAnimeEntryCaches(queryClient, mediaId, {
        entryId: updatedEntry?.id ?? undefined,
        progress: updatedProgress ?? undefined,
        status: updatedEntry?.status,
      });
      
      if (updatedMedia) {
        toast({
          title: "Progress updated",
          description: `${updatedMedia.title.romaji || updatedMedia.title.english}: Episode ${updatedProgress}`,
          variant: "default",
        });
      }
    },
    onError: (error: any, _variables, context) => {
      logger.error('Error updating progress:', error);
      restoreAnimeEntryCaches(queryClient, context?.snapshot ?? []);
      
      toast({
        title: "Update failed",
        description: error?.message || "Failed to update episode progress",
        variant: "destructive",
      });
    },
    onSettled: () => {
      revalidateActiveAnimeLists(queryClient);
    },
  });

  return {
    updateProgress: mutate,
    isUpdating: isPending,
    updateError: isError ? error : null,
  };
}
