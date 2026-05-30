import type { HeroSectionData } from "./types";

export function HeroSection({ title, bannerImage, coverImage }: HeroSectionData) {
  const bannerSrc = bannerImage || coverImage?.extraLarge || coverImage?.large;

  return (
    <div className="relative h-[250px] md:h-[350px] -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-muted group">
      {bannerSrc && (
        <img
          src={bannerSrc}
          alt={title?.english || title?.romaji || ""}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      {!bannerSrc && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-muted to-primary/10"></div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg">
            {title?.english || title?.romaji || "Unknown Title"}
          </h1>
          {title?.native && (
            <p className="text-lg text-muted-foreground drop-shadow-md">
              {title.native}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
