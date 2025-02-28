/**
 * Utility functions for anime-related components
 */

/**
 * Returns the appropriate color class for progress indicators
 */
export function getProgressColor(currentEp: number, nextEpisode: number | null | undefined) {
  if (!currentEp || !nextEpisode) return "text-muted-foreground";
  return currentEp < nextEpisode - 1
    ? "text-yellow-500 dark:text-yellow-400"
    : "text-green-500 dark:text-green-400";
}

/**
 * Returns the appropriate color class based on airing status
 */
export function getAiringStatusColor(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const timeUntil = timestamp - now;

  if (timeUntil < 0) return "text-gray-500 dark:text-gray-400";
  if (timeUntil < 3600) return "text-red-500 dark:text-red-400"; // Less than 1 hour
  if (timeUntil < 86400) return "text-yellow-500 dark:text-yellow-400"; // Less than 24 hours
  return "text-blue-500 dark:text-blue-400"; // More than 24 hours
}
