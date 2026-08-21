import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalResults: number | null;
  isLoading?: boolean;
}

export function SearchBar({
  searchQuery,
  setSearchQuery,
  totalResults,
  isLoading = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Clear search on Escape key
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSearchQuery]);

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground motion-reduce:animate-none" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder="Search anime..."
          aria-label="Search anime"
          className="h-11 py-2 pl-10 pr-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {searchQuery && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {totalResults !== null && (
        <div
          className="absolute -bottom-6 right-0 animate-in fade-in slide-in-from-top-1 text-xs text-muted-foreground duration-300 motion-reduce:animate-none"
          aria-live="polite"
        >
          {totalResults} result{totalResults !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
