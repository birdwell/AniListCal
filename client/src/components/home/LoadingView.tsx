import { Loader2 } from "lucide-react";
import { AnimeContent } from "./AnimeContent";
import { ViewToggle } from "./ViewToggle";

export function LoadingView() {
  return (
    <div className="flex justify-center w-full">
      {/* Loading overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your anime...</p>
        </div>
      </div>

      <div className="space-y-4 w-full px-4 sm:px-6 md:px-8 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <ViewToggle isCompact={true} onToggle={() => {}} />

        <AnimeContent
          animeEntries={[]}
          sectionStates={{
            airing: false,
            watching: false,
            onHold: false,
            planned: false,
          }}
          toggleSection={() => {}}
          isCompact={true}
        />
      </div>
    </div>
  );
}
