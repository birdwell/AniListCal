const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Formats a date string into a human-readable format
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Friday, 28th")
 */
export function formatDate(dateStr: string) {
  // Parse the date string (YYYY-MM-DD) into a Date object
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
  
  // Get the day of the month
  const dayOfMonth = date.getDate();
  
  // Get the appropriate suffix for the day
  const suffix = ['th', 'st', 'nd', 'rd'][
    dayOfMonth % 10 > 0 && dayOfMonth % 10 < 4 && (dayOfMonth < 11 || dayOfMonth > 13) ? dayOfMonth % 10 : 0
  ];
  
  // Get the day of the week
  const dayOfWeek = DAYS[date.getDay()];
  
  // Format the date
  return `${dayOfWeek}, ${dayOfMonth}${suffix}`;
}

/**
 * Determines if a show is a weekly show based on its airing date
 * @param timestamp Unix timestamp of the show's airing time
 * @returns Boolean indicating if it's a weekly show airing on the same day of week as today
 */
export function isWeeklyShow(timestamp: number): boolean {
  const now = new Date();
  const airingDate = new Date(timestamp * 1000);
  
  // Check if this is the same day of the week as today
  const isSameDayOfWeek = now.getDay() === airingDate.getDay();
  
  // Check if this is today's date
  const isToday = now.getDate() === airingDate.getDate() && 
                 now.getMonth() === airingDate.getMonth() && 
                 now.getFullYear() === airingDate.getFullYear();
  
  // Calculate time difference in days
  const timeDiffDays = Math.floor((airingDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
  
  // Check if it's within the next week (0-6 days away)
  const isWithinNextWeek = timeDiffDays >= 0 && timeDiffDays <= 6;
  
  // It's a weekly show if it's the same day of week, within next week, and not today
  return isSameDayOfWeek && isWithinNextWeek && !isToday;
}

/**
 * Formats time since a timestamp
 * @param timestamp Unix timestamp
 * @returns Formatted string showing time since the timestamp
 */
export function formatTimeSince(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const timeSince = Math.abs(now - timestamp);
  
  const hours = Math.floor(timeSince / 3600);
  const minutes = Math.floor((timeSince % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  
  return `${minutes}m ago`;
}

/**
 * Formats time until a timestamp
 * @param timestamp Unix timestamp
 * @returns Formatted string showing time until the timestamp
 */
export function formatTimeUntil(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const timeUntil = timestamp - now;

  if (timeUntil < 0) {
    // Show has already aired - calculate time since airing
    return formatTimeSince(timestamp);
  }

  // Show hasn't aired yet
  const hours = Math.floor(timeUntil / 3600);
  const minutes = Math.floor((timeUntil % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}