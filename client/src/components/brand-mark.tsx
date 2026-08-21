import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  showName?: boolean;
}

export function BrandMark({ className, showName = true }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/favicon-32x32.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 rounded-[7px]"
        decoding="async"
      />
      {showName ? (
        <span className="font-display text-lg font-semibold tracking-[-0.02em]">
          AniListCal
        </span>
      ) : null}
    </span>
  );
}
