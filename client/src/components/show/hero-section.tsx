import { MediaFragmentFragment } from "@/generated/graphql";

interface HeroSectionProps {
  show: MediaFragmentFragment;
}

export function HeroSection({ show }: HeroSectionProps) {
  const bannerSrc = show.bannerImage || show.coverImage?.extraLarge || show.coverImage?.large;

  return (
    <div className="relative h-[250px] md:h-[350px] -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-muted group">
      {/* Banner Image */}
      {bannerSrc && (
        <img
          src={bannerSrc}
          alt={show.title?.english || show.title?.romaji || ""}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Hide the image element if loading fails
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      {/* Fallback background if no image */}
      {!bannerSrc && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-muted to-primary/10"></div>
      )}


      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
        <div className="max-w-4xl mx-auto"> {/* Optional: Constrain text width */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg">
            {show.title?.english || show.title?.romaji || "Unknown Title"}
          </h1>
          {show.title?.native && (
            <p className="text-lg text-muted-foreground drop-shadow-md">
              {show.title.native}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
