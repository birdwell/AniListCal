import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { useUpdateProgress } from "@/hooks";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import ControlButton from "./control-button";
import { getProgressColor } from "@/lib/anime-utils";

type VariantType = "default" | "minimal" | "pill";

interface EpisodeControlsProps {
  mediaId: number;
  currentEpisode?: number;
  totalEpisodes: number;
  className?: string;
  compact?: boolean;
  variant?: VariantType;
  targetEpisode?: number;
}

// Main component
export function EpisodeControls({
  mediaId,
  currentEpisode = 0,
  totalEpisodes = 0,
  className,
  compact = false,
  variant = "default",
  targetEpisode = 0,
}: EpisodeControlsProps) {
  const [localProgress, setLocalProgress] = useState(currentEpisode);
  const { updateProgress, isUpdating } = useUpdateProgress();

  useEffect(() => {
    setLocalProgress(currentEpisode);
  }, [currentEpisode]);

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localProgress > 0 && !isUpdating) {
      const newProgress = localProgress - 1;
      setLocalProgress(newProgress);
      updateProgress(
        { mediaId, progress: newProgress },
        { onError: () => setLocalProgress(currentEpisode) },
      );
    }
  };

  // AniList often returns null episodes for ongoing seasons; callers coerce that
  // to 0. Only apply an upper bound when a real season total is known.
  const hasKnownTotal = totalEpisodes > 0;
  const canIncrement = !hasKnownTotal || localProgress < totalEpisodes;

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (canIncrement && !isUpdating) {
      const newProgress = localProgress + 1;
      setLocalProgress(newProgress);
      updateProgress(
        { mediaId, progress: newProgress },
        { onError: () => setLocalProgress(currentEpisode) },
      );
    }
  };

  const containerStyles = {
    minimal:
      "inline-grid h-11 flex-shrink-0 grid-cols-[2.75rem_minmax(2.75rem,auto)_2.75rem] items-center",
    pill:
      "inline-grid h-11 flex-shrink-0 grid-cols-[2.75rem_minmax(2.75rem,auto)_2.75rem] items-center overflow-hidden rounded-xl bg-secondary",
    default:
      "inline-grid h-11 flex-shrink-0 grid-cols-[2.75rem_minmax(2.75rem,auto)_2.75rem] items-center overflow-hidden rounded-xl bg-background ring-1 ring-border/70",
  }[variant];

  const incrementDisabled = isUpdating || !canIncrement;
  const decrementDisabled = isUpdating || localProgress === 0;
  const progressColorClass = getProgressColor(
    localProgress,
    targetEpisode || (hasKnownTotal ? totalEpisodes : null)
  );

  return (
    <TooltipProvider>
      <div
        className={cn(containerStyles, className)}
        role="group"
        aria-label="Episode progress controls"
      >
        {/* Decrement button */}
        <ControlButton
          icon={Minus}
          disabled={decrementDisabled}
          onClick={handleDecrement}
          tooltip="Decrease episode"
          compact={compact}
          isUpdating={isUpdating}
          variant={variant}
        />

        {/* Progress display */}
        <span
          className={cn(
            "min-w-11 whitespace-nowrap px-1 text-center font-data text-base font-semibold tabular-nums",
            !compact && "text-lg",
            progressColorClass
          )}
          aria-live="polite"
        >
          {localProgress}
          {totalEpisodes > 0 && (
            <span className={cn(progressColorClass)}>/{totalEpisodes}</span>
          )}
        </span>

        {/* Increment button */}
        <ControlButton
          icon={Plus}
          disabled={incrementDisabled}
          onClick={handleIncrement}
          tooltip="Increase episode"
          compact={compact}
          isUpdating={isUpdating}
          variant={variant}
        />
      </div>
    </TooltipProvider>
  );
}
