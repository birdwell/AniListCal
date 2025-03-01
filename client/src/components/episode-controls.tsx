import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useUpdateProgress } from "@/hooks";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EpisodeControlsProps {
  mediaId: number;
  currentEpisode?: number;
  totalEpisodes?: number;
  className?: string;
  compact?: boolean;
  onProgressUpdate?: (newProgress: number) => void;
  variant?: "default" | "minimal" | "pill";
}

export function EpisodeControls({
  mediaId,
  currentEpisode = 0,
  totalEpisodes,
  className,
  compact = false,
  onProgressUpdate,
  variant = "default",
}: EpisodeControlsProps) {
  const [localProgress, setLocalProgress] = useState(currentEpisode);
  const { updateProgress, isUpdating } = useUpdateProgress();
  
  // Update local progress when the prop changes (e.g., after refetch)
  useEffect(() => {
    setLocalProgress(currentEpisode);
  }, [currentEpisode]);

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (localProgress > 0 && !isUpdating) {
      const newProgress = localProgress - 1;
      setLocalProgress(newProgress);
      updateProgress({ mediaId, progress: newProgress });
      onProgressUpdate?.(newProgress);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    // Allow incrementing beyond total if totalEpisodes is unknown
    if ((totalEpisodes === undefined || localProgress < totalEpisodes) && !isUpdating) {
      const newProgress = localProgress + 1;
      setLocalProgress(newProgress);
      updateProgress({ mediaId, progress: newProgress });
      onProgressUpdate?.(newProgress);
    }
  };

  // Determine the appropriate styles based on variant
  const getContainerStyles = () => {
    switch (variant) {
      case "minimal":
        return "flex items-center gap-1";
      case "pill":
        return "flex items-center gap-1 bg-muted/80 backdrop-blur-sm p-1 rounded-full";
      default:
        return "flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg border border-border/50";
    }
  };

  const getButtonStyles = (isDisabled: boolean) => {
    const baseStyles = cn(
      compact ? "h-6 w-6" : "h-8 w-8", 
      "flex items-center justify-center rounded-full transition-all",
      isUpdating && "opacity-50 cursor-not-allowed",
      variant === "pill" ? "hover:bg-background/80" : "hover:bg-accent"
    );
    
    return cn(
      baseStyles,
      isDisabled ? "text-muted-foreground opacity-50" : "text-primary"
    );
  };

  return (
    <TooltipProvider>
      <div 
        className={cn(
          getContainerStyles(),
          className
        )}
        onClick={(e) => e.stopPropagation()} // Prevent card click event
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={getButtonStyles(isUpdating || localProgress === 0)}
              disabled={isUpdating || localProgress === 0}
              onClick={handleDecrement}
              aria-label="Decrease episode"
            >
              <Minus className={cn("h-4 w-4", compact && "h-3 w-3")} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Decrease episode</p>
          </TooltipContent>
        </Tooltip>
        
        <span className={cn(
          "font-medium min-w-[3ch] text-center px-1",
          compact ? "text-xs" : "text-sm"
        )}>
          {localProgress}
          {totalEpisodes && (
            <span className="text-muted-foreground">/{totalEpisodes}</span>
          )}
        </span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={getButtonStyles(isUpdating || (totalEpisodes !== undefined && localProgress >= totalEpisodes))}
              disabled={isUpdating || (totalEpisodes !== undefined && localProgress >= totalEpisodes)}
              onClick={handleIncrement}
              aria-label="Increase episode"
            >
              <Plus className={cn("h-4 w-4", compact && "h-3 w-3")} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Increase episode</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
