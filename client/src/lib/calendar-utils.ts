const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const suffix = ['th', 'st', 'nd', 'rd'][day % 10 > 0 && day % 10 < 4 && (day < 11 || day > 13) ? day % 10 : 0];
  return `${DAYS[date.getDay()]}, ${day}${suffix}`;
}

export function formatTimeUntil(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const timeUntil = timestamp - now;

  if (timeUntil < 0) return "Aired";

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

export function getProgressColor(currentEp: number, totalEp: number | null) {
  if (!totalEp) return "text-muted-foreground";
  return currentEp < totalEp
    ? "text-yellow-500 dark:text-yellow-400"
    : "text-green-500 dark:text-green-400";
}

export function getAiringStatusColor(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const timeUntil = timestamp - now;

  if (timeUntil < 0) return "text-gray-500 dark:text-gray-400";
  if (timeUntil < 3600) return "text-red-500 dark:text-red-400"; // Less than 1 hour
  if (timeUntil < 86400) return "text-yellow-500 dark:text-yellow-400"; // Less than 24 hours
  return "text-blue-500 dark:text-blue-400"; // More than 24 hours
}
