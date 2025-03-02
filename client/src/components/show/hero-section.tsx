import { MediaFragmentFragment } from "@/generated/graphql";

interface HeroSectionProps {
  show: MediaFragmentFragment;
}

export function HeroSection({ show }: HeroSectionProps) {
  // Add debug logging
  console.log("Hero section data:", {
    title: show.title,
    bannerImage: show.bannerImage,
    coverImage: show.coverImage,
  });
  return (
    <div className="relative h-[300px] md:h-[400px] -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden z-0 bg-muted/30">
      {/* Background color container */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />

      {/* Image container with max width to keep it contained */}
      <div className="absolute inset-0 max-w-5xl mx-auto flex items-center justify-center">
        <img
          src={
            show.bannerImage ||
            show.coverImage?.extraLarge ||
            show.coverImage?.large ||
            "https://via.placeholder.com/1200x400?text=No+Image+Available"
          }
          alt={show.title?.english || show.title?.romaji || "Anime"}
          className="object-fill object-top h-full"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/1200x400?text=No+Image+Available";
          }}
        />
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {show.title?.english || show.title?.romaji || "Unknown Title"}
          </h1>
          {show.title?.native && (
            <p className="text-lg text-muted-foreground">{show.title.native}</p>
          )}
        </div>
      </div>
    </div>
  );
}
