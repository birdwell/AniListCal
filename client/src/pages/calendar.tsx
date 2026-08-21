import React from "react";
import { useCalendar } from "../hooks/useCalendar";
import { DaySelector } from "../components/calendar/DaySelector";
import { ShowsList } from "../components/calendar/ShowsList";
import { AppState } from "@/components/app-state";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

function CalendarPage() {
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
    return (
      <PageShell size="wide" className="space-y-6">
        <PageHeader title="Calendar" />
        <AppState kind="loading" title="Loading your schedule" />
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" className="space-y-6">
      <PageHeader title="Calendar" />
      <DaySelector
        orderedDays={orderedDays}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />

      {showsForSelectedDate.length > 0 ? (
        <ShowsList
          showsForSelectedDate={showsForSelectedDate}
          selectedDay={selectedDay}
          selectedDate={selectedDate}
        />
      ) : (
        <AppState
          kind="empty"
          title="Nothing airs this day"
        />
      )}
    </PageShell>
  );
}

export default CalendarPage;
