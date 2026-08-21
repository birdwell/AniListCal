import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";

interface ViewToggleProps {
  isCompact: boolean;
  onToggle: () => void;
}

export function ViewToggle({ isCompact, onToggle }: ViewToggleProps) {
  const label = isCompact ? "Show grid view" : "Show list view";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      title={label}
      aria-label={label}
      className="min-h-11 min-w-11 shadow-sm transition-shadow hover:shadow motion-reduce:transition-none"
    >
      {isCompact ? (
        <LayoutGrid className="h-4 w-4" />
      ) : (
        <LayoutList className="h-4 w-4" />
      )}
    </Button>
  );
}
