import React from "react";

interface CoverImageProps {
  src: string;
  alt: string;
}

export function CoverImage({ src, alt }: CoverImageProps) {
  return (
    <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-16">
      <img
        src={src}
        alt={alt}
        width="96"
        height="144"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
