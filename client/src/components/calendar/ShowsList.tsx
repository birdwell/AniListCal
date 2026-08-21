import { Calendar as CalendarIcon } from "lucide-react";
import { EntyFragmentFragment } from "@/generated/graphql";
import { ShowCard } from "./ShowCard";
import { formatDate, getDayName } from "@/lib/calendar-utils";

interface ShowsListProps {
  showsForSelectedDate: [string, EntyFragmentFragment[]][];
  selectedDay: number;
  selectedDate: string;
}

export function ShowsList({ showsForSelectedDate, selectedDay, selectedDate }: ShowsListProps) {
  return (
    <div className="space-y-6">
      {showsForSelectedDate.length > 0 ? (
        <section className="rounded-xl bg-card p-4 sm:p-6" aria-live="polite">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarIcon className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="font-display text-xl font-semibold">
                {formatDate(selectedDate)}
              </h2>
            </div>
            <div className="space-y-3">
              {showsForSelectedDate.flatMap(([_, entries]) => 
                entries.map((entry, i) => (
                  <ShowCard key={`${entry.media?.id}-${i}`} entry={entry} />
                ))
              )}
            </div>
        </section>
      ) : (
        <div className="rounded-xl bg-card p-8 text-center text-muted-foreground" role="status">
            No shows airing on {getDayName(selectedDate)}
        </div>
      )}
    </div>
  );
}
