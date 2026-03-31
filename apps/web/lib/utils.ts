import type { ItemType } from "@/types";

/** Tailwind-safe class merger */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a date string to relative time (e.g. "2 days ago") */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const secs = Math.floor((now - then) / 1000);

  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Format reading time to human-readable */
export function formatReadingTime(minutes: number | null): string {
  if (!minutes) return "";
  return minutes < 2 ? "1 min read" : `${minutes} min read`;
}

/** Extract domain from a URL */
export function extractDomain(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

/** Truncate text to max length with ellipsis */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

/** Content-type icon map */
export const TYPE_ICONS: Record<ItemType, string> = {
  article: "📄",
  youtube: "▶️",
  tweet: "🐦",
  pdf: "📁",
  podcast: "🎙️",
  image: "🖼️",
  link: "🔗",
};

/** Content-type label map */
export const TYPE_LABELS: Record<ItemType, string> = {
  article: "Article",
  youtube: "YouTube",
  tweet: "Tweet",
  pdf: "PDF",
  podcast: "Podcast",
  image: "Image",
  link: "Link",
};
