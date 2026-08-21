import type { HeroSectionData } from "./types";

export function HeroSection({ title, bannerImage, coverImage }: HeroSectionData) {
  const bannerSrc = bannerImage || coverImage?.extraLarge || coverImage?.large;

  return (
    <header className="relative -mx-4 h-[250px] overflow-hidden bg-muted sm:mx-0 sm:rounded-2xl md:h-[350px]">
      {bannerSrc && (
        <img
          src={bannerSrc}
          alt={title?.english || title?.romaji || ""}
          width="1280"
          height="420"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      {!bannerSrc && (
        <div className="absolute inset-0 bg-primary/10"></div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
        <div className="max-w-4xl">
          <h1 className="font-display text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {title?.english || title?.romaji || "Unknown Title"}
          </h1>
          {title?.native && (
            <p className="mt-1 text-sm text-white/78 drop-shadow-md sm:text-base">
              {title.native}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
