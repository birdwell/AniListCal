import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useEffect } from "react";

interface ViewToggleProps {
  isCompact: boolean;
  onToggle: () => void;
}

export function ViewToggle({ isCompact, onToggle }: ViewToggleProps) {
  // Add keyboard shortcut for toggling view (Ctrl+G)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle]);
  return (
    <div className="flex justify-between items-center py-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">My Anime</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">
          {isCompact ? "List" : "Grid"} View
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          title={isCompact ? "Grid View" : "List View"}
          className="shadow-sm hover:shadow transition-all"
        >
          {isCompact ? (
            <LayoutGrid className="h-4 w-4" />
          ) : (
            <LayoutList className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
