import { EntyFragmentFragment } from "@/generated/graphql";
import { Link } from "wouter";

// Import the extracted components
import { CoverImage } from "./CoverImage";
import { EpisodeInfo } from "./EpisodeInfo";
import { EpisodeControls } from "@/components/episode-controls";

// Import the custom hook
import { useEpisodeDisplay } from "@/hooks/useEpisodeDisplay";

interface ShowCardProps {
  entry: EntyFragmentFragment;
}

export function ShowCard({ entry }: ShowCardProps) {
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

  return (
    <article className="relative rounded-xl border-l-2 border-l-live bg-muted/65 p-4 transition-colors hover:bg-muted">
      <Link
        href={`/show/${entry.media.id}`}
        aria-label={`View ${title}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex gap-3 items-center">
          {coverImage && <CoverImage src={coverImage} alt={title} />}
          <div className="space-y-1">
            <h3 className="font-medium line-clamp-2 sm:line-clamp-1">
              {title}
            </h3>
            <EpisodeInfo
              shouldShowPreviousEpisode={shouldShowPreviousEpisode}
              displayEpisode={displayEpisode}
              episode={episode}
              previousEpisodeAiringAt={previousEpisodeAiringAt}
              airingAt={airingAt}
            />
          </div>
        </div>
        <div className="relative z-20 flex items-center gap-4 text-sm">
          <div className="flex-shrink-0">
            <EpisodeControls
              mediaId={entry.media.id}
              currentEpisode={currentEpisode}
              totalEpisodes={totalEpisodes ?? 0}
              targetEpisode={episode}
              compact
              variant="pill"
              className="flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
