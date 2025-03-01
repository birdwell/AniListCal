import React from "react";

interface CoverImageProps {
  src: string;
  alt: string;
}

export function CoverImage({ src, alt }: CoverImageProps) {
  return (
    <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}
