import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VariantType = "default" | "minimal" | "pill";

export default function ControlButton({
  icon: Icon,
  disabled,
  onClick,
  tooltip,
  compact,
  isUpdating,
  variant,
}: {
  icon: typeof Plus | typeof Minus;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
  tooltip: string;
  compact: boolean;
  isUpdating: boolean;
  variant: VariantType;
}) {
  const buttonStyles = cn(
    compact ? "h-6 w-6" : "h-8 w-8",
    "flex items-center justify-center rounded-full transition-all",
    isUpdating && "opacity-50 cursor-not-allowed",
    variant === "pill" ? "hover:bg-background/80" : "hover:bg-accent",
    disabled ? "text-muted-foreground opacity-50" : "text-primary"
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={buttonStyles}
          disabled={disabled}
          onClick={onClick}
          aria-label={tooltip}
        >
          <Icon className={cn("h-4 w-4", compact && "h-3 w-3")} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}