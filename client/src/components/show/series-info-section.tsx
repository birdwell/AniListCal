import { MediaFragmentFragment } from "@/generated/graphql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Clock, Calendar, Film, Tv2, Globe, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

interface SeriesInfoSectionProps {
  show: MediaFragmentFragment;
}

export function SeriesInfoSection({ show }: SeriesInfoSectionProps) {
  // Debug logging
  useEffect(() => {
    console.log("Series Info Data:", {
      format: show.format,
      episodes: show.episodes,
      duration: show.duration,
      season: show.season,
      seasonYear: show.seasonYear,
      source: show.source,
      countryOfOrigin: show.countryOfOrigin,
      isAdult: show.isAdult,
      startDate: show.startDate,
      endDate: show.endDate,
      studios: show.studios
    });
  }, [show]);

  // Format the season and year
  const formatSeason = () => {
    if (!show.season) return null;

    const season = show.season.charAt(0) + show.season.slice(1).toLowerCase();
    return show.seasonYear ? `${season} ${show.seasonYear}` : season;
  };

  // Format the source
  const formatSource = () => {
    if (!show.source) return null;

    return show.source
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format the format (e.g., TV, MOVIE, OVA)
  const formatFormat = () => {
    if (!show.format) return null;

    // Special case for common acronyms
    if (['TV', 'OVA', 'ONA'].includes(show.format)) {
      return show.format;
    }

    return show.format
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format dates
  const formatDate = (date: { year?: number | null; month?: number | null; day?: number | null } | null | undefined) => {
    if (!date || !date.year) return null;

    const month = date.month ? new Date(0, date.month - 1).toLocaleString('default', { month: 'short' }) : null;
    const day = date.day;

    if (month && day) {
      return `${month} ${day}, ${date.year}`;
    } else if (month) {
      return `${month} ${date.year}`;
    } else {
      return date.year.toString();
    }
  };

  // Format the airing period
  const formatAiringPeriod = () => {
    const startDate = formatDate(show.startDate);
    const endDate = formatDate(show.endDate);

    if (startDate && endDate) {
      return `${startDate} to ${endDate}`;
    } else if (startDate) {
      return `${startDate} to ?`;
    } else {
      return null;
    }
  };

  // Format country code to country name
  const formatCountry = (countryCode: string | null | undefined) => {
    if (!countryCode) return null;

    const countries: Record<string, string> = {
      'JP': 'Japan',
      'KR': 'South Korea',
      'CN': 'China',
      'TW': 'Taiwan',
      'US': 'United States',
      'GB': 'United Kingdom',
      'FR': 'France',
      'CA': 'Canada',
      'DE': 'Germany',
      // Add more as needed
    };

    return countries[countryCode] || countryCode;
  };

  const country = formatCountry(show.countryOfOrigin);
  const hasInfo = show.format || show.episodes || show.season || show.source || country ||
    show.isAdult || formatAiringPeriod() || (show.studios?.nodes?.length ?? 0) > 0;

  console.log("Has series info:", hasInfo);

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
            {/* Format */}
            {formatFormat() && (
              <div className="flex items-center gap-3">
                <Film className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Format</div>
                  <div className="text-sm text-muted-foreground">{formatFormat()}</div>
                </div>
              </div>
            )}

            {/* Episodes & Duration */}
            <div className="flex items-center gap-3">
              <Tv2 className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">Episodes</div>
                <div className="text-sm text-muted-foreground">
                  {show.episodes || '?'} {show.duration && `(${show.duration} min each)`}
                </div>
              </div>
            </div>

            {/* Season */}
            {formatSeason() && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Season</div>
                  <div className="text-sm text-muted-foreground">{formatSeason()}</div>
                </div>
              </div>
            )}

            {/* Source */}
            {formatSource() && (
              <div className="flex items-center gap-3">
                <Info className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Source</div>
                  <div className="text-sm text-muted-foreground">{formatSource()}</div>
                </div>
              </div>
            )}

            {/* Country of Origin */}
            {country && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Country</div>
                  <div className="text-sm text-muted-foreground">{country}</div>
                </div>
              </div>
            )}

            {/* Adult Content Warning */}
            {show.isAdult && (
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <div>
                  <div className="text-sm font-medium">Content Rating</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs py-0 h-5 border-warning text-warning">
                      18+
                    </Badge>
                    <span className="text-xs text-muted-foreground">Adult Content</span>
                  </div>
                </div>
              </div>
            )}

            {/* Airing Period */}
            {formatAiringPeriod() && (
              <div className="flex items-center gap-3 md:col-span-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Aired</div>
                  <div className="text-sm text-muted-foreground">{formatAiringPeriod()}</div>
                </div>
              </div>
            )}

            {/* Studios */}
            {show.studios?.nodes && show.studios.nodes.length > 0 && (
              <div className="flex items-center gap-3 md:col-span-2">
                <div className="h-4 w-4 flex items-center justify-center text-primary">🏢</div>
                <div>
                  <div className="text-sm font-medium">Studios</div>
                  <div className="text-sm text-muted-foreground">
                    {show.studios.nodes
                      .filter((studio): studio is NonNullable<typeof studio> => studio !== null)
                      .map(studio => studio.name)
                      .join(', ')}
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
