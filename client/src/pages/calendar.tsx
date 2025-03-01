import { useQuery } from "@tanstack/react-query";
import { fetchUserAnime } from "@/lib/anilist";
import { getUser } from "@/lib/auth";
import { useState } from "react";
import { EntyFragmentFragment, MediaListStatus } from "@/generated/graphql";
import {
  CalendarCard,
  DaySelector,
  LoadingView,
  ShowsList,
} from "@/components/calendar";
import { commonQueryOptions } from "@/lib/query-config";
import { format } from "date-fns";
import { isWeeklyShow } from "@/lib/calendar-utils";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Helper function to group shows by airing date
export function groupShowsByAiringDate(
  animeEntries: EntyFragmentFragment[] | undefined
): Record<string, EntyFragmentFragment[]> {
  if (!animeEntries) return {};

  const today = new Date();
  const todayString = format(today, "yyyy-MM-dd");

  return animeEntries
    .filter(
      (entry) => entry.media?.nextAiringEpisode && entry.status == "CURRENT"
    )
    .reduce((acc, entry) => {
      if (!entry.media?.nextAiringEpisode) return acc;

      // Create a date object from the timestamp
      const timestamp = entry.media.nextAiringEpisode.airingAt * 1000;

      // Create a date object that properly accounts for local timezone
      const nextAiringDate = new Date(timestamp);

      // Format the date in local timezone (YYYY-MM-DD)
      let key = format(nextAiringDate, "yyyy-MM-dd");

      // Check if this is a weekly show that should also appear on today's calendar
      // This uses our isWeeklyShow helper which checks if the show airs on the same day of week as today
      if (isWeeklyShow(entry.media.nextAiringEpisode.airingAt)) {
        // Add it to both today and its actual airing date
        if (!acc[todayString]) acc[todayString] = [];
        // Create a copy of the entry for today's display
        const todayEntry = JSON.parse(JSON.stringify(entry));
        acc[todayString].push(todayEntry);
      }

      // Still add it to its actual airing date as well
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);

      return acc;
    }, {} as Record<string, EntyFragmentFragment[]>);
}

export default function CalendarPage() {
  // Initialize with day index 0 (today), not the day of week
  const [selectedDay, setSelectedDay] = useState<number>(0);

  // Get the current day of week (0-6, 0 is Sunday)
  const currentDayOfWeek = new Date().getDay();

  // Order days starting with today's day of week
  const orderedDays = DAYS.slice(currentDayOfWeek).concat(
    DAYS.slice(0, currentDayOfWeek)
  );

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser,
    ...commonQueryOptions,
  });

  const { data: animeEntries, isLoading: isAnimeLoading } = useQuery({
    queryKey: ["/anilist/anime", user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("Please set your Anilist ID in your profile");
      }
      return fetchUserAnime(user.id, [MediaListStatus.Current]);
    },
    enabled: !!user?.id,
    ...commonQueryOptions,
  });

  const isLoading = isLoadingUser || isAnimeLoading;

  // Group shows by airing date
  const airingDateMap = groupShowsByAiringDate(animeEntries);

  // Get the next 7 days starting from today
  const today = new Date();
  const nextWeekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return format(date, "yyyy-MM-dd");
  });

  // Filter shows for the selected day (0 = today, 1 = tomorrow, etc.)
  const selectedDate = nextWeekDates[selectedDay];

  // Get entries for the selected date
  const filteredDates = Object.entries(airingDateMap).filter(([date]) => {
    return date === selectedDate;
  });

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

      <ShowsList filteredDates={filteredDates} selectedDay={selectedDay} />
    </div>
  );
}
