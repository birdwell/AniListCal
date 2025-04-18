import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { EntyFragmentFragment, MediaListStatus } from '@/generated/graphql';
import { fetchUserAnime } from '@/lib/anilist';
import { isWeeklyShow } from '@/lib/calendar-utils';
import { commonQueryOptions } from '@/lib/query-config';
import { queryAniList, getUser, type User } from '@/lib/auth';

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
export function useNextWeekDates(startDate?: Date) {
  return useMemo(() => {
    const today = startDate || new Date();
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }

    return dates;
  }, [startDate]);
}

/**
 * Helper function to group shows by airing date
 */
export function groupShowsByAiringDate(
  animeEntries: EntyFragmentFragment[] | undefined
): Record<string, EntyFragmentFragment[]> {
  if (!animeEntries) return {};

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  // Collect entries by date
  const dateMap: Record<string, EntyFragmentFragment[]> = {};

  animeEntries
    .filter(
      (entry) => entry.media?.nextAiringEpisode && entry.status === 'CURRENT'
    )
    .forEach((entry) => {
      // Since we filtered for non-null values above, we can safely assert these exist
      const airingAt = entry.media!.nextAiringEpisode!.airingAt;
      const timestamp = airingAt * 1000;
      const nextAiringDate = new Date(timestamp);
      const key = format(nextAiringDate, 'yyyy-MM-dd');

      // Add to its actual airing date
      if (!dateMap[key]) dateMap[key] = [];
      dateMap[key].push(entry);
    });

  // Add weekly shows to today if needed
  animeEntries
    .filter(
      (entry) => entry.media?.nextAiringEpisode && entry.status === 'CURRENT'
    )
    .forEach((entry) => {
      // Since we filtered for non-null values above, we can safely assert these exist
      const airingAt = entry.media!.nextAiringEpisode!.airingAt;
      const timestamp = airingAt * 1000;
      const nextAiringDate = new Date(timestamp);
      const key = format(nextAiringDate, 'yyyy-MM-dd');
      if (
        isWeeklyShow(airingAt) &&
        key !== todayString
      ) {
        // Only add to today if the show airs within the next 7 days
        const diffDays = Math.floor((nextAiringDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays <= 6) {
          if (!dateMap[todayString]) dateMap[todayString] = [];
          // Avoid duplicate (don't add if already present for today)
          if (!dateMap[todayString].some(e => e.id === entry.id)) {
            dateMap[todayString].push({ ...entry });
          }
        }
      }
    });

  // Sort entries for each date by airing time ascending, then by id ascending for stable order
  Object.keys(dateMap).forEach(date => {
    dateMap[date].sort((a, b) => {
      const aTime = a.media?.nextAiringEpisode?.airingAt ?? 0;
      const bTime = b.media?.nextAiringEpisode?.airingAt ?? 0;
      if (aTime !== bTime) return aTime - bTime;
      return String(a.id).localeCompare(String(b.id));
    });
  });

  // Sort the date keys in ascending order and return a new object
  const sortedDateKeys = Object.keys(dateMap).sort();
  const sortedDateMap: Record<string, EntyFragmentFragment[]> = {};
  for (const date of sortedDateKeys) {
    sortedDateMap[date] = dateMap[date];
  }

  return sortedDateMap;
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
    if (!selectedDate || !airingDateMap) return [];
    return Object.entries(airingDateMap).filter(([date]) => date === selectedDate);
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
