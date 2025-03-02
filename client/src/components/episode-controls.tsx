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
      updateProgress({ mediaId, progress: newProgress });
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canIncrement = localProgress < totalEpisodes;

    if (canIncrement && !isUpdating) {
      const newProgress = localProgress + 1;
      setLocalProgress(newProgress);
      updateProgress({ mediaId, progress: newProgress });
    }
  };

  const containerStyles = {
    minimal: "inline-flex items-center flex-shrink-0 gap-1",
    pill: "inline-flex items-center flex-shrink-0 gap-1 bg-muted/80 backdrop-blur-sm p-1 rounded-full",
    default:
      "inline-flex items-center flex-shrink-0 gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg border border-border/50",
  }[variant];

  const incrementDisabled = isUpdating || localProgress >= totalEpisodes;
  const decrementDisabled = isUpdating || localProgress === 0;
  const progressColorClass = getProgressColor(
    currentEpisode,
    targetEpisode ?? totalEpisodes
  );

  return (
    <TooltipProvider>
      <div className={cn(containerStyles, className)}>
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
            "font-medium w-auto text-center px-1 whitespace-nowrap",
            compact ? "text-xs" : "text-sm",
            progressColorClass
          )}
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
