import { LoadingGrid } from "./LoadingGrid";

export function LoadingView() {
  return (
    <div className="space-y-4 container mx-auto px-4 sm:px-6 lg:px-8">
      <section>
        <h2 className="text-base font-medium mb-2">Your Anime</h2>
        <LoadingGrid />
      </section>
    </div>
  );
}
