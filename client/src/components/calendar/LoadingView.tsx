import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingGrid } from "./LoadingGrid";

export function LoadingView() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
      <Card className="overflow-x-auto -mx-4 sm:mx-0 rounded-none sm:rounded-lg">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex gap-2 sm:gap-3 min-w-max">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <Card className="hidden lg:block">
          <CardContent className="p-4">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <LoadingGrid />
      </div>
    </div>
  );
}
