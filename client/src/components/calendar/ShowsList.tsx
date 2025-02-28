import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EntyFragmentFragment } from "@/generated/graphql";
import { ShowCard } from "./ShowCard";
import { formatDate } from "@/lib/calendar-utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ShowsListProps {
  filteredDates: [string, EntyFragmentFragment[]][];
  selectedDay: number;
}

export function ShowsList({ filteredDates, selectedDay }: ShowsListProps) {
  return (
    <div className="space-y-6">
      {filteredDates.length > 0 ? (
        filteredDates.map(([date, entries]) => (
          <Card key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">
                  {formatDate(date)}
                </h3>
              </div>
              <div className="space-y-3">
                {entries.map((entry, i) => (
                  <ShowCard key={i} entry={entry} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6 text-center text-muted-foreground">
            No shows airing on {DAYS[selectedDay]}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
