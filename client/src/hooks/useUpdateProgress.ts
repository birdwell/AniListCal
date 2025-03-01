import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryAniList } from '@/lib/auth';
import { UPDATE_PROGRESS_MUTATION } from '@/queries/queries';
import { toast } from '@/hooks/use-toast';
import { clearAnimeListCache } from '@/lib/anilist';

interface UpdateProgressVariables {
  mediaId: number;
  progress: number;
}

/**
 * Custom hook for updating episode progress for an anime
 * @returns Mutation functions and state for updating episode progress
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async ({ mediaId, progress }: UpdateProgressVariables) => {
      return queryAniList(UPDATE_PROGRESS_MUTATION, {
        mediaId,
        progress,
      });
    },
    onSuccess: (data) => {
      // Extract the updated media info from the response
      const updatedMedia = data?.data?.SaveMediaListEntry?.media;
      const updatedProgress = data?.data?.SaveMediaListEntry?.progress;
      
      if (updatedMedia) {
        // Show success toast
        toast({
          title: "Progress Updated",
          description: `${updatedMedia.title.romaji || updatedMedia.title.english}: Episode ${updatedProgress}`,
          variant: "default",
        });

        // Clear cache to force a refresh of anime list data
        clearAnimeListCache();
        
        // Invalidate relevant queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['userAnime'] });
      }
    },
    onError: (error: any) => {
      console.error('Error updating progress:', error);
      
      // Show error toast
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update episode progress",
        variant: "destructive",
      });
    },
  });

  return {
    updateProgress: mutate,
    isUpdating: isPending,
    updateError: isError ? error : null,
  };
}
