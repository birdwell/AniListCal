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