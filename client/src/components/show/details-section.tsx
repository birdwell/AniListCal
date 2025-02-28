import { MediaFragmentFragment } from "@/generated/graphql";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Info, PlayCircle, Users } from "lucide-react";

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

  return (
    <div className="grid md:grid-cols-[2fr_1fr] gap-6">
      <div className="space-y-6">
        <p className="text-muted-foreground whitespace-pre-line">
          {show.description}
        </p>
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
                {formatTimeUntilAiring(
                  show.nextAiringEpisode.timeUntilAiring
                )}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <PlayCircle className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Episodes: {show.episodes || "TBA"}
            </span>
          </div>
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
