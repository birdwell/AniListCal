import React from "react";
import { useCalendar } from "../hooks/useCalendar";
import { LoadingView } from "../components/calendar/LoadingView";
import { DaySelector } from "../components/calendar/DaySelector";
import { ShowsList } from "../components/calendar/ShowsList";

export default function CalendarPage() {
  // Use our custom hook that combines all calendar functionality
  const {
    selectedDay,
    setSelectedDay,
    orderedDays,
    selectedDate,
    showsForSelectedDate,
    isLoading,
  } = useCalendar();

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
      <DaySelector
        orderedDays={orderedDays}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />

      <ShowsList
        showsForSelectedDate={showsForSelectedDate}
        selectedDay={selectedDay}
        selectedDate={selectedDate}
      />
    </div>
  );
}
