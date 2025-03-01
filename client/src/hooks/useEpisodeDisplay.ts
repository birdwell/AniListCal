import { useMemo } from "react";
import { isWeeklyShow } from "@/lib/calendar-utils";

export function useEpisodeDisplay(airingAt: number, episode: number) {
  return useMemo(() => {
    // Get current date information
    const now = new Date();
    const airingDate = new Date(airingAt * 1000);

    // Check if this is today's date
    const isToday =
      now.getDate() === airingDate.getDate() &&
      now.getMonth() === airingDate.getMonth() &&
      now.getFullYear() === airingDate.getFullYear();

    // Check if this is a weekly show
    const isShowWeekly = isWeeklyShow(airingAt);

    // Determine if we should show the previous episode
    const shouldShowPreviousEpisode = isToday || isShowWeekly;

    // For today's shows or weekly shows, we'll display the previous episode
    const displayEpisode = shouldShowPreviousEpisode ? episode - 1 : episode;

    // Calculate the previous episode's airing time (approximately 7 days ago)
    const previousEpisodeAiringAt = airingAt - 7 * 24 * 60 * 60;

    return {
      shouldShowPreviousEpisode,
      displayEpisode,
      previousEpisodeAiringAt,
    };
  }, [airingAt, episode]);
}
