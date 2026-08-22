import { Button } from "@/components/ui/button";

interface DaySelectorProps {
  orderedDays: string[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
}

export function DaySelector({ 
  orderedDays, 
  selectedDay, 
  setSelectedDay 
}: DaySelectorProps) {
  return (
    <div
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      aria-label="Choose airing day"
    >
        <div className="flex min-w-max snap-x gap-2" role="tablist">
          {orderedDays.slice(0, 7).map((day, index) => {
            // index is already the day relative to today (0=today, 1=tomorrow, etc.)
            return (
              <Button
                key={day}
                variant={selectedDay === index ? "default" : "outline"}
                onClick={() => setSelectedDay(index)}
                className="snap-start px-4 font-data text-sm"
                role="tab"
                aria-selected={selectedDay === index}
              >
                <span className="sm:hidden">{day.slice(0, 3)}</span>
                <span className="hidden sm:inline">{day}</span>
              </Button>
            );
          })}
        </div>
    </div>
  );
}
