import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryAniList } from '../lib/anilistProxy';
import { logger } from '../lib/logger';
import { UPDATE_STATUS_MUTATION } from '@/queries/queries';
import { toast } from '@/hooks/use-toast';
import { MediaListStatus } from '@/generated/graphql';
import {
  cancelAnimeEntryQueries,
  patchAnimeEntryCaches,
  revalidateActiveAnimeLists,
  restoreAnimeEntryCaches,
  snapshotAnimeEntryCaches,
} from '@/lib/animeCache';

interface UpdateStatusVariables {
  mediaId: number;
  status: MediaListStatus;
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
 * Custom hook for updating the watch status of an anime
 * @returns Mutation functions and state for updating watch status
 */
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async ({ mediaId, status }: UpdateStatusVariables) => {
      return queryAniList<SaveMediaListEntryResult>(UPDATE_STATUS_MUTATION, {
        mediaId,
        status,
      });
    },
    onMutate: async ({ mediaId, status }) => {
      await cancelAnimeEntryQueries(queryClient, mediaId);
      const snapshot = snapshotAnimeEntryCaches(queryClient, mediaId);

      patchAnimeEntryCaches(queryClient, mediaId, { status });
      return { snapshot };
    },
    onSuccess: (data, variables) => {
      const updatedEntry = data?.data?.SaveMediaListEntry;
      const updatedMedia = data?.data?.SaveMediaListEntry?.media;
      const updatedStatus = data?.data?.SaveMediaListEntry?.status;

      patchAnimeEntryCaches(queryClient, variables.mediaId, {
        entryId: updatedEntry?.id ?? undefined,
        progress: updatedEntry?.progress ?? undefined,
        status: updatedStatus,
      });
      
      if (updatedMedia) {
        const formattedStatus = formatStatus(updatedStatus ?? null);
        
        toast({
          title: "Status updated",
          description: `${updatedMedia.title.romaji || updatedMedia.title.english}: ${formattedStatus}`,
          variant: "default",
        });
      }
    },
    onError: (error: any, _variables, context) => {
      logger.error('Error updating status:', error);
      restoreAnimeEntryCaches(queryClient, context?.snapshot ?? []);
      
      toast({
        title: "Update failed",
        description: error?.message || "Failed to update watch status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      revalidateActiveAnimeLists(queryClient);
    },
  });

  return {
    updateStatus: mutate,
    isUpdating: isPending,
    updateError: isError ? error : null,
  };
}

function formatStatus(status: MediaListStatus | null): string {
  if (!status) return 'Unknown';
  
  switch (status) {
    case MediaListStatus.Current:
      return 'Watching';
    case MediaListStatus.Completed:
      return 'Completed';
    case MediaListStatus.Planning:
      return 'Plan to Watch';
    case MediaListStatus.Dropped:
      return 'Dropped';
    case MediaListStatus.Paused:
      return 'Paused';
    case MediaListStatus.Repeating:
      return 'Rewatching';
    default:
      return status;
  }
}
