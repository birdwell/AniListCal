import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryAniList } from '../lib/auth';
import { logger } from '../lib/logger';
import { UPDATE_STATUS_MUTATION } from '@/queries/queries';
import { toast } from '@/hooks/use-toast';
import { clearAnimeListCache } from '@/lib/anilist';
import { MediaListStatus } from '@/generated/graphql';

interface UpdateStatusVariables {
  mediaId: number;
  status: MediaListStatus;
}

/**
 * Custom hook for updating the watch status of an anime
 * @returns Mutation functions and state for updating watch status
 */
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async ({ mediaId, status }: UpdateStatusVariables) => {
      return queryAniList(UPDATE_STATUS_MUTATION, {
        mediaId,
        status,
      });
    },
    onMutate: async ({ mediaId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/anilist/anime', mediaId] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['/anilist/anime', mediaId]);
      
      // Optimistically update the cache with the new status
      queryClient.setQueryData(['/anilist/anime', mediaId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          mediaListEntry: {
            ...old.mediaListEntry,
            status,
          }
        };
      });
      
      // Return a context object with the snapshotted value
      return { previousData };
    },
    onSuccess: (data, variables) => {
      // Extract the updated media info from the response
      const updatedMedia = data?.data?.SaveMediaListEntry?.media;
      const updatedStatus = data?.data?.SaveMediaListEntry?.status;
      
      if (updatedMedia) {
        // Format status for display (convert CURRENT to Watching, etc.)
        const formattedStatus = formatStatus(updatedStatus);
        
        // Show success toast
        toast({
          title: "Status Updated",
          description: `${updatedMedia.title.romaji || updatedMedia.title.english}: ${formattedStatus}`,
          variant: "default",
        });

        // Clear cache to force a refresh of anime list data
        clearAnimeListCache();
        
        // Update the specific anime query with the new data
        queryClient.setQueryData(['/anilist/anime', variables.mediaId], (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            mediaListEntry: {
              ...old.mediaListEntry,
              status: updatedStatus,
            }
          };
        });
        
        // Invalidate relevant queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['userAnime'] });
        queryClient.invalidateQueries({ queryKey: ['/anilist/anime'] });
      }
    },
    onError: (error: any, variables, context) => {
      logger.error('Error updating status:', error);
      
      // Show error toast
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update watch status",
        variant: "destructive",
      });
      
      // Rollback to the previous value if available
      if (context?.previousData) {
        queryClient.setQueryData(['/anilist/anime', variables.mediaId], context.previousData);
      }
    },
  });

  return {
    updateStatus: mutate,
    isUpdating: isPending,
    updateError: isError ? error : null,
  };
}

/**
 * Format MediaListStatus enum values to user-friendly strings
 */
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
