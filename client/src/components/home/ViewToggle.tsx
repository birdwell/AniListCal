import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";

interface ViewToggleProps {
  isCompact: boolean;
  onToggle: () => void;
}

export function ViewToggle({ isCompact, onToggle }: ViewToggleProps) {
  return (
    <div className="flex justify-end">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        title={isCompact ? "Grid View" : "List View"}
      >
        {isCompact ? (
          <LayoutGrid className="h-4 w-4" />
        ) : (
          <LayoutList className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
