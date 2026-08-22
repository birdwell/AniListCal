/**
 * Utility functions for anime-related components
 */

type ProgressSortable = {
  progress?: number | null;
  status?: string | null;
  media?: {
    id?: number | null;
    episodes?: number | null;
    nextAiringEpisode?: { episode: number; airingAt?: number | null } | null;
  } | null;
};

/** Episodes released so far: prefer next-airing signal, else known total. */
export function availableEpisodeCount(entry: ProgressSortable): number {
  const next = entry.media?.nextAiringEpisode;
  if (next?.episode != null) {
    const airingAt = next.airingAt;
    if (airingAt != null && airingAt <= Math.floor(Date.now() / 1000)) {
      return next.episode;
    }
    return Math.max(0, next.episode - 1);
  }
  return entry.media?.episodes ?? 0;
}

/** How many released episodes the user has not watched yet. */
export function episodesBehind(entry: ProgressSortable): number {
  return availableEpisodeCount(entry) - (entry.progress ?? 0);
}

/** Increment cap: what's out if airing, else season total, else unbounded. */
export function progressCeiling(entry: ProgressSortable): number | null {
  if (entry.media?.nextAiringEpisode?.episode != null) {
    return availableEpisodeCount(entry);
  }
  const episodes = entry.media?.episodes ?? 0;
  if (episodes > 0) return episodes;
  return null;
}

function completionRatio(entry: ProgressSortable): number {
  const progress = entry.progress ?? 0;
  const available = availableEpisodeCount(entry);
  if (available <= 0) return 0;
  return progress / available;
}

/**
 * Started shows first, then higher absolute progress (5 before 4).
 * Within the same progress, less caught up first; fully caught up last.
 */
export function compareEntriesByWatchProgress(
  a: ProgressSortable,
  b: ProgressSortable
): number {
  const progressA = a.progress ?? 0;
  const progressB = b.progress ?? 0;
  const startedA = progressA > 0 ? 1 : 0;
  const startedB = progressB > 0 ? 1 : 0;
  if (startedA !== startedB) return startedB - startedA;

  if (progressA !== progressB) return progressB - progressA;

  // Lower catch-up ratio first (behind before caught up).
  return completionRatio(a) - completionRatio(b);
}

/**
 * Pick the CURRENT show most likely to watch next: smallest backlog among
 * shows that aren't caught up; on a tie, highest progress, then lower media id.
 */
export function findWatchNextEntry<T extends ProgressSortable>(
  entries: readonly T[]
): T | null {
  let best: T | null = null;
  let bestBehind = Number.POSITIVE_INFINITY;
  let bestProgress = -1;
  let bestMediaId = Number.POSITIVE_INFINITY;

  for (const entry of entries) {
    if (entry.status !== "CURRENT") continue;

    const behind = episodesBehind(entry);
    if (behind <= 0) continue;

    const progress = entry.progress ?? 0;
    const mediaId = entry.media?.id ?? Number.POSITIVE_INFINITY;

    if (
      behind < bestBehind ||
      (behind === bestBehind && progress > bestProgress) ||
      (behind === bestBehind &&
        progress === bestProgress &&
        mediaId < bestMediaId)
    ) {
      best = entry;
      bestBehind = behind;
      bestProgress = progress;
      bestMediaId = mediaId;
    }
  }

  return best;
}

/**
 * Returns the appropriate color class for progress indicators
 */
export function getProgressColor(progress: number, available: number) {
  if (progress === 0 || available <= 0) return "text-muted-foreground";

  // If the user is more than 1 episode behind, show yellow (needs attention)
  if (available - progress > 1) {
    return "text-warning";
  }

  // If the user is caught up or only 1 episode behind, show green
  return "text-success";
}

/**
 * Returns the appropriate color class based on airing status
 */
export function getAiringStatusColor(timestamp: number) {
  const now = Math.floor(Date.now() / 1000);
  const timeUntil = timestamp - now;

  if (timeUntil < 0) {
    const timeSince = Math.abs(timeUntil);
    if (timeSince < 3600) return "text-success"; // Aired less than 1 hour ago
    if (timeSince < 86400) return "text-success"; // Aired less than 24 hours ago
    return "text-muted-foreground"; // Aired more than 24 hours ago
  }
  
  if (timeUntil < 3600) return "text-live"; // Less than 1 hour
  if (timeUntil < 86400) return "text-warning"; // Less than 24 hours
  return "text-primary"; // More than 24 hours
}
