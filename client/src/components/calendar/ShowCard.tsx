import { EntyFragmentFragment } from "@/generated/graphql";
import { ChevronRight } from "lucide-react";
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
    <article className="group relative rounded-xl bg-muted/45 p-3 transition-[background-color,box-shadow] duration-150 hover:bg-muted hover:shadow-raised motion-reduce:transition-none sm:p-4">
      <Link
        href={`/show/${entry.media.id}`}
        aria-label={`View ${title}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      />
      <div className="flex w-full gap-3 sm:gap-4">
        {coverImage && <CoverImage src={coverImage} alt={title} />}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 group-hover:text-primary sm:line-clamp-1 sm:text-base">
              {title}
            </h3>
            <ChevronRight
              className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary"
              aria-hidden
            />
          </div>
          <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <EpisodeInfo
                shouldShowPreviousEpisode={shouldShowPreviousEpisode}
                displayEpisode={displayEpisode}
                episode={episode}
                previousEpisodeAiringAt={previousEpisodeAiringAt}
                airingAt={airingAt}
              />
            </div>
            <div className="relative z-20 ml-auto shrink-0">
              <EpisodeControls
                mediaId={entry.media.id}
                currentEpisode={currentEpisode}
                totalEpisodes={totalEpisodes ?? 0}
                nextAiringEpisode={{ episode, airingAt }}
                compact
                variant="pill"
                className="shrink-0"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
