import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

export function CalendarCard() {
  return (
    <Card className="hidden lg:block">
      <CardContent className="p-4">
        <Calendar
          mode="single"
          selected={new Date()}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  );
}
