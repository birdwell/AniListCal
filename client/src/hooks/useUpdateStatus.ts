import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryAniList } from '../lib/auth';
import { logger } from '../lib/logger';
import { UPDATE_STATUS_MUTATION } from '@/queries/queries';
import { toast } from '@/hooks/use-toast';
import { invalidateAnimeQueries } from '@/lib/invalidateAnimeQueries';
import { queryKeys } from '@/lib/queryKeys';
import { MediaListStatus } from '@/generated/graphql';

interface UpdateStatusVariables {
  mediaId: number;
  status: MediaListStatus;
}

interface SaveMediaListEntryResult {
  SaveMediaListEntry?: {
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
      const detailKey = queryKeys.animeDetail(mediaId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      
      const previousData = queryClient.getQueryData(detailKey);
      
      queryClient.setQueryData(detailKey, (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          mediaListEntry: {
            ...old.mediaListEntry,
            status,
          }
        };
      });
      
      return { previousData, mediaId };
    },
    onSuccess: (data, variables) => {
      const updatedMedia = data?.data?.SaveMediaListEntry?.media;
      const updatedStatus = data?.data?.SaveMediaListEntry?.status;
      
      if (updatedMedia) {
        const formattedStatus = formatStatus(updatedStatus ?? null);
        
        toast({
          title: "Status Updated",
          description: `${updatedMedia.title.romaji || updatedMedia.title.english}: ${formattedStatus}`,
          variant: "default",
        });

        queryClient.setQueryData(queryKeys.animeDetail(variables.mediaId), (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            mediaListEntry: {
              ...old.mediaListEntry,
              status: updatedStatus,
            }
          };
        });
        
        invalidateAnimeQueries(queryClient);
      }
    },
    onError: (error: any, variables, context) => {
      logger.error('Error updating status:', error);
      
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update watch status",
        variant: "destructive",
      });
      
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.animeDetail(variables.mediaId), context.previousData);
      }
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
