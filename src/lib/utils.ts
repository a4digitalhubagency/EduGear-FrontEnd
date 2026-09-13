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
export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}