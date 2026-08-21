import { Skeleton } from "@/components/ui/skeleton";

export function LoadingView() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-10" role="status" aria-label="Loading schedule">
      <span className="sr-only">Loading schedule</span>
      <div className="-mx-4 overflow-hidden px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-11 w-20 rounded-lg" />
            ))}
          </div>
      </div>

      <div className="space-y-3 rounded-xl bg-card p-4 sm:p-6">
        <Skeleton className="mb-5 h-8 w-52" />
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
