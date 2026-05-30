import { Loader2 } from "lucide-react";
import { AnimeContent } from "./AnimeContent";
import { ViewToggle } from "./ViewToggle";

export function LoadingView() {
  return (
    <div className="relative w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your anime...</p>
        </div>
      </div>

      <div className="space-y-4 opacity-50 pointer-events-none">
        <ViewToggle isCompact={true} onToggle={() => {}} />
        <AnimeContent animeEntries={[]} />
      </div>
    </div>
  );
}
