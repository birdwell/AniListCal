import { EntyFragmentFragment } from "@/generated/graphql";
import { useLocation } from "wouter";

// Import the extracted components
import { CoverImage } from "./CoverImage";
import { EpisodeInfo } from "./EpisodeInfo";
import { ProgressDisplay } from "./ProgressDisplay";

// Import the custom hook
import { useEpisodeDisplay } from "@/hooks/useEpisodeDisplay";

interface ShowCardProps {
  entry: EntyFragmentFragment;
}

export function ShowCard({ entry }: ShowCardProps) {
  const [, navigate] = useLocation();

  // Early return if no next airing episode
  if (!entry.media?.nextAiringEpisode) return null;

  // Extract data from entry
  const title =
    entry.media.title?.english || entry.media.title?.romaji || "Unknown Title";
  const episode = entry.media.nextAiringEpisode.episode;
  const currentEpisode = entry.progress || 0;
  const totalEpisodes = entry.media.episodes;
  const airingAt = entry.media.nextAiringEpisode.airingAt;
  const coverImage =
    entry.media.coverImage?.large || entry.media.coverImage?.extraLarge;

  // Use custom hook for episode display logic
  const { shouldShowPreviousEpisode, displayEpisode, previousEpisodeAiringAt } =
    useEpisodeDisplay(airingAt, episode);

  // Determine target episode for progress comparison
  const targetEpisode = shouldShowPreviousEpisode ? episode - 1 : episode;
  
  // Determine if we need to show catch-up warning
  const showCatchUpWarning = shouldShowPreviousEpisode && currentEpisode < episode - 1;

  const handleClick = () => {
    if (entry.media?.id) {
      navigate(`/show/${entry.media.id}`);
    }
  };

  return (
    <div
      className="p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex gap-3 items-center">
          {coverImage && <CoverImage src={coverImage} alt={title} />}
          <div className="space-y-1">
            <span className="font-medium line-clamp-2 sm:line-clamp-1">
              {title}
            </span>
            <EpisodeInfo
              shouldShowPreviousEpisode={shouldShowPreviousEpisode}
              displayEpisode={displayEpisode}
              episode={episode}
              previousEpisodeAiringAt={previousEpisodeAiringAt}
              airingAt={airingAt}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <ProgressDisplay
            currentEpisode={currentEpisode}
            targetEpisode={targetEpisode}
            totalEpisodes={totalEpisodes}
          />
        </div>
      </div>
    </div>
  );
}
