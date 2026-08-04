import { Link } from "wouter";
import { StatusSelector } from "@/components/status-selector";
import type { SearchMediaResult } from "@/lib/anilist";
import { MediaFormat, MediaListStatus } from "@/generated/graphql";

interface SearchResultRowProps {
  media: NonNullable<SearchMediaResult>;
}

function formatMediaFormat(format: MediaFormat | null | undefined): string | null {
  if (!format) return null;

  switch (format) {
    case MediaFormat.Tv:
      return "TV";
    case MediaFormat.TvShort:
      return "TV Short";
    case MediaFormat.Movie:
      return "Movie";
    case MediaFormat.Special:
      return "Special";
    case MediaFormat.Ova:
      return "OVA";
    case MediaFormat.Ona:
      return "ONA";
    case MediaFormat.Music:
      return "Music";
    case MediaFormat.Manga:
      return "Manga";
    case MediaFormat.Novel:
      return "Novel";
    case MediaFormat.OneShot:
      return "One Shot";
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

export function SearchResultRow({ media }: SearchResultRowProps) {
  const title =
    media.title?.english || media.title?.romaji || media.title?.native || "Unknown";
  const imageUrl = media.coverImage?.large ?? "";
  const formatLabel = formatMediaFormat(media.format);
  const metaParts = [
    formatLabel,
    media.seasonYear ? String(media.seasonYear) : null,
    media.episodes != null ? `${media.episodes} eps` : null,
  ].filter(Boolean);

  const currentStatus: MediaListStatus | null =
    media.mediaListEntry?.status ?? null;

  return (
    <div className="flex items-center gap-3 sm:gap-4 py-3 border-b border-border/60 last:border-b-0">
      <Link href={`/show/${media.id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div className="h-16 w-11 sm:h-20 sm:w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm sm:text-base line-clamp-2 hover:text-primary">
            {title}
          </h3>
          {metaParts.length > 0 && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {metaParts.join(" · ")}
            </p>
          )}
        </div>
      </Link>

      <div
        className="w-[9.5rem] sm:w-44 flex-shrink-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <StatusSelector
          mediaId={media.id}
          currentStatus={currentStatus}
          variant="compact"
          className="w-full"
        />
      </div>
    </div>
  );
}
