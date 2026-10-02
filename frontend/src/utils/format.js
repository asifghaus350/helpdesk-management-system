// =========================
// RELATIVE TIME
// =========================
// "Just now", "5m ago", "3h ago", "2d ago", then a date.

export const timeAgo = (date) => {
  if (!date) return "—";

  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
};

// First letters of the first two words, e.g. "Asif Ghaus" -> "AG"
export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "?";

// 45 min · 5.5 h · 2.3 days
export const formatDuration = (ms) => {
  if (ms == null || Number.isNaN(ms)) return "—";

  const hours = ms / (60 * 60 * 1000);

  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)} h`;

  const days = hours / 24;
  return `${days < 10 ? days.toFixed(1) : Math.round(days)} days`;
};
