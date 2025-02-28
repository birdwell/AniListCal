import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { fetchAnimeDetails } from "@/lib/anilist";
import { MediaFragmentFragment } from "@/generated/graphql";
import {
  LoadingSkeleton,
  HeroSection,
  DetailsSection,
  CharactersSection,
  ErrorDisplay
} from "@/components/show";

export default function ShowPage() {
  const { id } = useParams();
  const animeId = id ? parseInt(id) : undefined;

  const {
    data: show,
    isLoading,
    error,
  } = useQuery<MediaFragmentFragment>({
    queryKey: ["/anilist/anime", animeId],
    queryFn: () => {
      if (!animeId || isNaN(animeId)) {
        throw new Error("Invalid anime ID");
      }
      return fetchAnimeDetails(animeId);
    },
    enabled: !!animeId && !isNaN(animeId),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <ErrorDisplay message={error?.message} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      <HeroSection show={show} />
      <DetailsSection show={show} />
      <CharactersSection show={show} />
    </div>
  );
}
