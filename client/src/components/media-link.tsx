import type { ReactNode } from "react";
import { Link } from "wouter";
import { MediaType } from "@/generated/graphql";

interface MediaLinkProps {
  mediaId: number;
  mediaType: MediaType | null | undefined;
  className?: string;
  label: string;
  children: ReactNode;
}

export interface MediaDestination {
  href: string;
  external: boolean;
}

export function getMediaDestination(
  mediaId: number,
  mediaType: MediaType | null | undefined,
): MediaDestination {
  if (mediaType === MediaType.Anime) {
    return { href: `/show/${mediaId}`, external: false };
  }

  return {
    href: `https://anilist.co/manga/${mediaId}`,
    external: true,
  };
}

export function MediaLink({
  mediaId,
  mediaType,
  className,
  label,
  children,
}: MediaLinkProps) {
  const destination = getMediaDestination(mediaId, mediaType);

  if (destination.external) {
    return (
      <a
        href={destination.href}
        className={className}
        target="_blank"
        rel="noreferrer"
        aria-label={`${label} on AniList (opens in a new tab)`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={destination.href} className={className} aria-label={label}>
      {children}
    </Link>
  );
}
