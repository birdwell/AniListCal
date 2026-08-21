import React from "react";

interface CoverImageProps {
  src: string;
  alt: string;
}

export function CoverImage({ src, alt }: CoverImageProps) {
  return (
    <div className="h-[4.5rem] w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
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
