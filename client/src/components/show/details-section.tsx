import { MediaFragmentFragment } from "@/generated/graphql";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Info, PlayCircle, Users } from "lucide-react";
import { EpisodeControls } from "@/components/episode-controls";
import ReactMarkdown from "react-markdown";

interface DetailsSectionProps {
  show: MediaFragmentFragment;
}

export function DetailsSection({ show }: DetailsSectionProps) {
  const formatTimeUntilAiring = (timeUntilAiring: number) => {
    const days = Math.floor(timeUntilAiring / 86400);
    const hours = Math.floor((timeUntilAiring % 86400) / 3600);
    const minutes = Math.floor((timeUntilAiring % 3600) / 60);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  // Function to safely render HTML content
  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  return (
    <div className="grid md:grid-cols-[2fr_1fr] gap-6">
      <div className="space-y-6">
        <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none">
          {show.description && (
            <div
              dangerouslySetInnerHTML={createMarkup(show.description)}
              className="text-foreground"
            />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {show.genres?.map((genre) => (
            <Badge key={genre} variant="secondary">
              {genre}
            </Badge>
          ))}
        </div>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm">Status: {show.status}</span>
          </div>
          {show.nextAiringEpisode && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Episode {show.nextAiringEpisode.episode} airing in{" "}
                {formatTimeUntilAiring(show.nextAiringEpisode.timeUntilAiring)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <PlayCircle className="h-4 w-4 text-primary" />
            <span className="text-sm">Episodes: {show.episodes || "TBA"}</span>
          </div>
          {/* @ts-ignore - We know mediaListEntry might not be in the type but it's in the data */}
          {show.mediaListEntry && (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 flex items-center justify-center text-primary">
                📺
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Progress:</span>
                <EpisodeControls
                  mediaId={show.id}
                  currentEpisode={show.mediaListEntry.progress || 0}
                  totalEpisodes={show.episodes || 0}
                  compact
                  variant="minimal"
                />
              </div>
            </div>
          )}
          {show.studios?.nodes?.[0] && (
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Studio: {show.studios.nodes[0].name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
