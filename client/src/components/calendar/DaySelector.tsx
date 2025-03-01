import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="overflow-x-auto -mx-4 sm:mx-0 rounded-none sm:rounded-lg">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex gap-2 sm:gap-3 min-w-max">
          {orderedDays.slice(0, 7).map((day, index) => {
            // index is already the day relative to today (0=today, 1=tomorrow, etc.)
            return (
              <Button
                key={day}
                variant={selectedDay === index ? "default" : "outline"}
                onClick={() => setSelectedDay(index)}
                className="px-3 sm:px-5 py-2 text-sm sm:text-base"
              >
                {window.innerWidth < 640 ? day.slice(0, 3) : day}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
