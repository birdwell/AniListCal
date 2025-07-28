import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">
                {formatDate(selectedDate)}
              </h3>
            </div>
            <div className="space-y-3">
              {showsForSelectedDate.flatMap(([_, entries]) => 
                entries.map((entry, i) => (
                  <ShowCard key={`${entry.media?.id}-${i}`} entry={entry} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6 text-center text-muted-foreground">
            No shows airing on {getDayName(selectedDate)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
