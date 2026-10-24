import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely (handles conflicting utility classes).
 * Standard shadcn-style helper used across the EduGear component library.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * First letter of up to the first two words of a name, e.g. "Aisha Bello" -> "AB".
 * Used for the faceless initials avatars across the Students screens (list
 * table, profile header) — deliberately no photo avatars anywhere in this
 * project's mock data.
 */
/**
 * "15 Sep 2025" from a backend ISO date. Date-only fields are stored as UTC
 * midnight, so format in UTC or a negative-offset timezone would show the day before.
 */
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Today as "YYYY-MM-DD" in the user's own timezone (toISOString would give the UTC date). */
export function todayInput() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "2025-09-15" for an <input type="date">, from a backend ISO date. */
export function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

/** "₦42,800,000" or, compact, "₦42.8M". Backend amounts are plain naira. */
export function formatNaira(amount: number, compact = false) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: compact ? 1 : 0,
    ...(compact ? { notation: "compact" as const } : {}),
  }).format(amount);
}

/** "5 minutes ago", "yesterday", "3 days ago"... from an ISO timestamp. */
export function formatRelativeTime(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}