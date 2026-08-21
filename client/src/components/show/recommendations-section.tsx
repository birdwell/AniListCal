import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecommendationsSectionData } from "./types";
import { MediaLink } from "@/components/media-link";

export function RecommendationsSection({
  recommendations,
}: RecommendationsSectionData) {
  const recommendationNodes =
    recommendations?.nodes?.filter(
      (node) => node !== null && node.mediaRecommendation !== null
    ) || [];

  if (!recommendations || recommendationNodes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="font-display text-xl font-semibold">Recommendations</h2>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {recommendationNodes.map((recommendation) => {
            const media = recommendation?.mediaRecommendation;
            if (!media) return null;

            const title =
              media.title?.english || media.title?.romaji || "Unknown title";

            return (
              <MediaLink
                key={recommendation?.id}
                mediaId={media.id}
                mediaType={media.type}
                label={`Open ${title}`}
                className="group"
              >
                <div className="flex h-full overflow-hidden rounded-lg bg-muted/60 transition-colors hover:bg-muted motion-reduce:transition-none sm:flex-col">
                  <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden sm:aspect-[3/4] sm:h-auto sm:w-full">
                    <img
                      src={media.coverImage?.large || ""}
                      alt=""
                      width={230}
                      height={345}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    {recommendation?.rating && (
                      <div className="absolute right-1 top-1 flex items-center gap-1 rounded-full bg-background/80 px-1.5 py-0.5 text-xs font-medium sm:right-2 sm:top-2 sm:px-2 sm:py-1">
                        <ThumbsUp className="h-2.5 w-2.5 text-primary sm:h-3 sm:w-3" />
                        <span>Score {recommendation.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-3">
                    <h4 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary motion-reduce:transition-none">
                      {title}
                    </h4>
                    <div className="mt-1 flex flex-wrap gap-1 sm:mt-2">
                      {media.format && (
                        <Badge
                          variant="outline"
                          className="h-4 py-0 text-xs sm:h-5"
                        >
                          {media.format}
                        </Badge>
                      )}
                      {media.status && (
                        <Badge
                          variant="secondary"
                          className="h-4 py-0 text-xs sm:h-5"
                        >
                          {media.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </MediaLink>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
