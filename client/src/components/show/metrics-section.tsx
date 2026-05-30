import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Award, TrendingUp, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { MetricsSectionData } from "./types";

export function MetricsSection({
  averageScore,
  meanScore,
  popularity,
  favourites,
  rankings,
}: MetricsSectionData) {
  const formatRankingContext = (context: string): string => {
    if (!context) return "General";

    return context
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const allTimeRankings =
    rankings?.filter((ranking) => ranking !== null && ranking?.allTime) || [];

  const seasonalRankings =
    rankings?.filter(
      (ranking) =>
        ranking !== null &&
        !ranking?.allTime &&
        ranking?.season &&
        ranking?.year
    ) || [];

  const topRankings = [...allTimeRankings, ...seasonalRankings].slice(0, 3);
  const hasMetrics = averageScore || popularity || topRankings.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasMetrics ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Score</span>
                <span className="text-lg font-bold">
                  {averageScore ? `${averageScore}%` : "N/A"}
                </span>
              </div>
              {averageScore ? (
                <Progress value={averageScore} className="h-2" />
              ) : (
                <div className="text-xs text-muted-foreground">
                  No score data available
                </div>
              )}
              {meanScore && meanScore !== averageScore && (
                <div className="text-xs text-muted-foreground mt-1">
                  Mean Score: {meanScore}%
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Popularity Rank</span>
              </div>
              <div className="text-lg font-bold">
                {popularity ? `#${popularity.toLocaleString()}` : "N/A"}
              </div>
              {favourites && (
                <div className="text-xs text-muted-foreground">
                  {favourites.toLocaleString()} favorites
                </div>
              )}
            </div>

            {topRankings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Rankings</span>
                </div>
                <div className="space-y-2">
                  {topRankings.map((ranking, index) => (
                    <div
                      key={ranking?.id || `ranking-${index}`}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">
                        {ranking?.allTime
                          ? `All-time ${formatRankingContext(ranking.context || "")}`
                          : `${ranking?.season || "Unknown Season"} ${ranking?.year || ""} ${formatRankingContext(ranking?.context || "")}`}
                      </span>
                      <span className="font-semibold">
                        #{ranking?.rank || "?"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>No metrics available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
