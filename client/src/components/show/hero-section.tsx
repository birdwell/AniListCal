import { MediaFragmentFragment } from "@/generated/graphql";

interface HeroSectionProps {
  show: MediaFragmentFragment;
}

export function HeroSection({ show }: HeroSectionProps) {
  return (
    <div className="relative h-[300px] md:h-[400px] -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
      <img
        src={show.bannerImage || show.coverImage.large}
        alt={show.title?.english || show.title?.romaji || ""}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
          {show.title?.english || show.title?.romaji}
        </h1>
        {show.title?.native && (
          <p className="text-lg text-muted-foreground">{show.title.native}</p>
        )}
      </div>
    </div>
  );
}
