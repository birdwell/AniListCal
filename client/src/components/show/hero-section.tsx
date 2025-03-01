import { MediaFragmentFragment } from "@/generated/graphql";
import { EpisodeControls } from "@/components/episode-controls";

interface HeroSectionProps {
  show: MediaFragmentFragment;
}

export function HeroSection({ show }: HeroSectionProps) {
  return (
    <div className="relative h-[300px] md:h-[400px] -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden z-0">
      <img
        src={show.bannerImage || show.coverImage.large}
        alt={show.title?.english || show.title?.romaji || ""}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {show.title?.english || show.title?.romaji}
          </h1>
          {show.title?.native && (
            <p className="text-lg text-muted-foreground">{show.title.native}</p>
          )}
        </div>
        
        {show.mediaListEntry && (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-3">
              <span className="text-sm font-medium bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">Progress:</span>
              <EpisodeControls
                mediaId={show.id}
                currentEpisode={show.mediaListEntry.progress || 0}
                totalEpisodes={show.episodes}
                variant="pill"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
