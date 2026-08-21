import { Skeleton } from "@/components/ui/skeleton";

export function LoadingView() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-10" role="status" aria-label="Loading your anime">
      <span className="sr-only">Loading your anime</span>
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="rounded-2xl bg-card p-4 sm:p-5">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="flex gap-4 rounded-xl bg-muted/60 p-4">
              <Skeleton className="h-24 w-16 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-3 py-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {[0, 1, 2].map((item) => <Skeleton key={item} className="h-14 w-full rounded-xl" />)}
    </div>
  );
}
