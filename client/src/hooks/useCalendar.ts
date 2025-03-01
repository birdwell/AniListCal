import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { EntyFragmentFragment, MediaListStatus } from '@/generated/graphql';
import { fetchUserAnime } from '@/lib/anilist';
import { getUser } from '@/lib/auth';
import { isWeeklyShow } from '@/lib/calendar-utils';
import { commonQueryOptions } from '@/lib/query-config';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Custom hook to manage calendar day selection
 */
export function useDaySelection() {
  // Initialize with day index 0 (today)
  const [selectedDay, setSelectedDay] = useState<number>(0);

  // Get the current day of week (0-6, 0 is Sunday)
  const currentDayOfWeek = useMemo(() => new Date().getDay(), []);

  // Order days starting with today's day of week
  const orderedDays = useMemo(
    () => DAYS.slice(currentDayOfWeek).concat(DAYS.slice(0, currentDayOfWeek)),
    [currentDayOfWeek]
  );

  return {
    selectedDay,
    setSelectedDay,
    orderedDays,
  };
}

/**
 * Custom hook to get the next 7 days from today
 */
export function useNextWeekDates() {
  return useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return format(date, 'yyyy-MM-dd');
    });
  }, []);
}

/**
 * Helper function to group shows by airing date
 */
function groupShowsByAiringDate(
  animeEntries: EntyFragmentFragment[] | undefined
): Record<string, EntyFragmentFragment[]> {
  if (!animeEntries) return {};

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  return animeEntries
    .filter(
      (entry) => entry.media?.nextAiringEpisode && entry.status === 'CURRENT'
    )
    .reduce((acc, entry) => {
      if (!entry.media?.nextAiringEpisode) return acc;

      // Create a date object from the timestamp
      const timestamp = entry.media.nextAiringEpisode.airingAt * 1000;

      // Create a date object that properly accounts for local timezone
      const nextAiringDate = new Date(timestamp);

      // Format the date in local timezone (YYYY-MM-DD)
      const key = format(nextAiringDate, 'yyyy-MM-dd');

      // Check if this is a weekly show that should also appear on today's calendar
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

/**
 * Custom hook to fetch and organize anime data for the calendar
 */
export function useAnimeCalendarData() {
  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users/current'],
    queryFn: getUser,
    ...commonQueryOptions,
  });

  // Fetch anime entries for the current user
  const { data: animeEntries, isLoading: isAnimeLoading } = useQuery({
    queryKey: ['/anilist/anime', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Please set your Anilist ID in your profile');
      }
      return fetchUserAnime(user.id, [MediaListStatus.Current]);
    },
    enabled: !!user?.id,
    ...commonQueryOptions,
  });

  // Group shows by airing date - memoize to prevent recalculation on every render
  const airingDateMap = useMemo(
    () => groupShowsByAiringDate(animeEntries),
    [animeEntries]
  );

  return {
    airingDateMap,
    isLoading: isLoadingUser || isAnimeLoading,
  };
}

/**
 * Custom hook that combines all calendar functionality
 */
export function useCalendar() {
  const { selectedDay, setSelectedDay, orderedDays } = useDaySelection();
  const nextWeekDates = useNextWeekDates();
  const { airingDateMap, isLoading } = useAnimeCalendarData();

  // Get the selected date string
  const selectedDate = nextWeekDates[selectedDay];

  // Get entries for the selected date
  const showsForSelectedDate = useMemo(() => {
    return Object.entries(airingDateMap).filter(
      ([date]) => date === selectedDate
    );
  }, [airingDateMap, selectedDate]);

  return {
    selectedDay,
    setSelectedDay,
    orderedDays,
    selectedDate,
    showsForSelectedDate,
    isLoading,
  };
}
