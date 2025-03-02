import { MediaFragmentFragment } from "@/generated/graphql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

interface RecommendationsSectionProps {
  show: MediaFragmentFragment;
}

export function RecommendationsSection({ show }: RecommendationsSectionProps) {
  // Debug logging
  useEffect(() => {
    console.log("Recommendations Data:", show.recommendations);
  }, [show.recommendations]);

  // Filter out null recommendations
  const recommendations = show.recommendations?.nodes?.filter(node => 
    node !== null && node.mediaRecommendation !== null
  ) || [];
  
  if (!show.recommendations || !recommendations || recommendations.length === 0) {
    console.log("No recommendations available");
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ThumbsUp className="h-5 w-5 text-primary" />
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.map(recommendation => (
              <a 
                key={recommendation?.id} 
                href={`/show/${recommendation?.mediaRecommendation?.id}`}
                className="group"
              >
                <div className="flex flex-col h-full rounded-md overflow-hidden border bg-card transition-colors hover:bg-accent/30">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img 
                      src={recommendation?.mediaRecommendation?.coverImage?.large || ''} 
                      alt={recommendation?.mediaRecommendation?.title?.romaji || ''} 
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                    {recommendation?.rating && (
                      <div className="absolute top-2 right-2 bg-background/80 rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-primary" />
                        {recommendation.rating}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {recommendation?.mediaRecommendation?.title?.english || 
                       recommendation?.mediaRecommendation?.title?.romaji}
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {recommendation?.mediaRecommendation?.format && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {recommendation.mediaRecommendation.format}
                        </Badge>
                      )}
                      {recommendation?.mediaRecommendation?.status && (
                        <Badge variant="secondary" className="text-xs py-0 h-5">
                          {recommendation.mediaRecommendation.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>No recommendations available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
