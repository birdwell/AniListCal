/**
 * Utility functions for anime-related components
 */

/**
 * Returns the appropriate color class for progress indicators
 */
export function getProgressColor(currentEp: number, nextEpisode: number | null | undefined) {
  if (!currentEp || !nextEpisode) return "text-muted-foreground";
  
  // If the user is more than 1 episode behind, show yellow (needs attention)
  if (currentEp < nextEpisode - 1) {
    return "text-yellow-500 dark:text-yellow-400";
  }
  
  // If the user is caught up or only 1 episode behind, show green
  return "text-green-500 dark:text-green-400";
}

/**
 * Returns the appropriate color class based on airing status
 */
export function getAiringStatusColor(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const timeUntil = timestamp - now;

  if (timeUntil < 0) {
    const timeSince = Math.abs(timeUntil);
    if (timeSince < 3600) return "text-green-500 dark:text-green-400"; // Aired less than 1 hour ago
    if (timeSince < 86400) return "text-green-600 dark:text-green-500"; // Aired less than 24 hours ago
    return "text-gray-500 dark:text-gray-400"; // Aired more than 24 hours ago
  }
  
  if (timeUntil < 3600) return "text-red-500 dark:text-red-400"; // Less than 1 hour
  if (timeUntil < 86400) return "text-yellow-500 dark:text-yellow-400"; // Less than 24 hours
  return "text-blue-500 dark:text-blue-400"; // More than 24 hours
}
