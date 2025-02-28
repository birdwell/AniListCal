import { useQuery } from "@tanstack/react-query";
import { fetchUserAnime } from "@/lib/anilist";
import { getUser } from "@/lib/auth";
import { useState } from "react";
import { EntyFragmentFragment } from "@/generated/graphql";
import {
  CalendarCard,
  DaySelector,
  LoadingView,
  ShowsList
} from "@/components/calendar";
import { commonQueryOptions } from "@/lib/query-config";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper function to group shows by airing date
function groupShowsByAiringDate(
  animeEntries: EntyFragmentFragment[] | undefined
): Record<string, EntyFragmentFragment[]> {
  if (!animeEntries) return {};

  return animeEntries
    .filter(entry => 
      entry.media?.nextAiringEpisode && entry.status == "CURRENT"
    )
    .reduce((acc, entry) => {
      if (!entry.media?.nextAiringEpisode) return acc;
      
      const date = new Date(entry.media.nextAiringEpisode.airingAt * 1000);
      const key = date.toISOString().split('T')[0];
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      
      return acc;
    }, {} as Record<string, EntyFragmentFragment[]>);
}

export default function CalendarPage() {
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(today);

  const orderedDays = DAYS.slice(today).concat(DAYS.slice(0, today));

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser,
    ...commonQueryOptions
  });

  const { data: animeEntries, isLoading: isAnimeLoading } = useQuery({
    queryKey: ["/anilist/anime", user?.sub],
    queryFn: () => {
      if (!user?.anilistId) {
        throw new Error("Please set your Anilist ID in your profile");
      }
      return fetchUserAnime(parseInt(user.anilistId), user.accessToken || "");
    },
    enabled: !!user?.anilistId && !!user?.accessToken,
    ...commonQueryOptions
  });

  const isLoading = isLoadingUser || isAnimeLoading;

  // Group shows by airing date
  const airingDateMap = groupShowsByAiringDate(animeEntries);
  
  // Filter shows by selected day
  const filteredDates = Object.entries(airingDateMap).filter(([date]) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === selectedDay;
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

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <CalendarCard />
        <ShowsList filteredDates={filteredDates} selectedDay={selectedDay} />
      </div>
    </div>
  );
}