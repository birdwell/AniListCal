import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Info,
  Clock,
  Calendar,
  Film,
  Tv2,
  Globe,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SeriesInfoSectionData } from "./types";

export function SeriesInfoSection({
  format,
  episodes,
  duration,
  season,
  seasonYear,
  source,
  countryOfOrigin,
  isAdult,
  startDate,
  endDate,
  studios,
}: SeriesInfoSectionData) {
  const formatSeason = () => {
    if (!season) return null;
    const label = season.charAt(0) + season.slice(1).toLowerCase();
    return seasonYear ? `${label} ${seasonYear}` : label;
  };

  const formatSource = () => {
    if (!source) return null;
    return source
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatFormat = () => {
    if (!format) return null;
    if (["TV", "OVA", "ONA"].includes(format)) {
      return format;
    }
    return format
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatDate = (
    date:
      | { year?: number | null; month?: number | null; day?: number | null }
      | null
      | undefined
  ) => {
    if (!date?.year) return null;

    const month = date.month
      ? new Date(0, date.month - 1).toLocaleString("default", { month: "short" })
      : null;
    const day = date.day;

    if (month && day) {
      return `${month} ${day}, ${date.year}`;
    }
    if (month) {
      return `${month} ${date.year}`;
    }
    return date.year.toString();
  };

  const formatAiringPeriod = () => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    if (start && end) {
      return `${start} to ${end}`;
    }
    if (start) {
      return `${start} to ?`;
    }
    return null;
  };

  const formatCountry = (countryCode: string | null | undefined) => {
    if (!countryCode) return null;

    const countries: Record<string, string> = {
      JP: "Japan",
      KR: "South Korea",
      CN: "China",
      TW: "Taiwan",
      US: "United States",
      GB: "United Kingdom",
      FR: "France",
      CA: "Canada",
      DE: "Germany",
    };

    return countries[countryCode] || countryCode;
  };

  const country = formatCountry(countryOfOrigin);
  const hasInfo =
    format ||
    episodes ||
    season ||
    source ||
    country ||
    isAdult ||
    formatAiringPeriod() ||
    (studios?.nodes?.length ?? 0) > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Series Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formatFormat() && (
              <div className="flex items-center gap-3">
                <Film className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Format</div>
                  <div className="text-sm text-muted-foreground">
                    {formatFormat()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Tv2 className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">Episodes</div>
                <div className="text-sm text-muted-foreground">
                  {episodes || "?"}{" "}
                  {duration && `(${duration} min each)`}
                </div>
              </div>
            </div>

            {formatSeason() && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Season</div>
                  <div className="text-sm text-muted-foreground">
                    {formatSeason()}
                  </div>
                </div>
              </div>
            )}

            {formatSource() && (
              <div className="flex items-center gap-3">
                <Info className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Source</div>
                  <div className="text-sm text-muted-foreground">
                    {formatSource()}
                  </div>
                </div>
              </div>
            )}

            {country && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Country</div>
                  <div className="text-sm text-muted-foreground">{country}</div>
                </div>
              </div>
            )}

            {isAdult && (
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <div>
                  <div className="text-sm font-medium">Content Rating</div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs py-0 h-5 border-warning text-warning"
                    >
                      18+
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Adult Content
                    </span>
                  </div>
                </div>
              </div>
            )}

            {formatAiringPeriod() && (
              <div className="flex items-center gap-3 md:col-span-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Aired</div>
                  <div className="text-sm text-muted-foreground">
                    {formatAiringPeriod()}
                  </div>
                </div>
              </div>
            )}

            {studios?.nodes && studios.nodes.length > 0 && (
              <div className="flex items-center gap-3 md:col-span-2">
                <div className="h-4 w-4 flex items-center justify-center text-primary">
                  🏢
                </div>
                <div>
                  <div className="text-sm font-medium">Studios</div>
                  <div className="text-sm text-muted-foreground">
                    {studios.nodes
                      .filter(
                        (studio): studio is NonNullable<typeof studio> =>
                          studio !== null
                      )
                      .map((studio) => studio.name)
                      .join(", ")}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>No series information available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
