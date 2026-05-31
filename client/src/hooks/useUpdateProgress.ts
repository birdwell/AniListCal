import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryAniList } from '../lib/anilistProxy';
import { logger } from '../lib/logger';
import { UPDATE_PROGRESS_MUTATION } from '@/queries/queries';
import { toast } from '@/hooks/use-toast';
import { invalidateAnimeQueries } from '@/lib/invalidateAnimeQueries';
import { MediaListStatus } from '@/generated/graphql';

interface UpdateProgressVariables {
  mediaId: number;
  progress: number;
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
    onSuccess: (data) => {
      const updatedMedia = data?.data?.SaveMediaListEntry?.media;
      const updatedProgress = data?.data?.SaveMediaListEntry?.progress;
      
      if (updatedMedia) {
        toast({
          title: "Progress Updated",
          description: `${updatedMedia.title.romaji || updatedMedia.title.english}: Episode ${updatedProgress}`,
          variant: "default",
        });

        invalidateAnimeQueries(queryClient);
      }
    },
    onError: (error: any) => {
      logger.error('Error updating progress:', error);
      
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
