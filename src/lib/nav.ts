import type { LucideIcon } from "lucide-react";
import {
  GraduationCap,
  LayoutDashboard,
  Settings as SettingsIcon,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Sidebar navigation — flat list, confirmed against two independent Stitch
 * screens that agree on this structure: "School Administrator Dashboard -
 * Overview" and "Students - List View (Desktop)". This supersedes the
 * earlier grouped-nav version (Overview / School Management / Finance /
 * Academics / Communication) that was pulled from a different card
 * ("Application Shell - Desktop View") which turned out to be an outlier —
 * see docs/ARCHITECTURE.md §3.4 for the full discrepancy note.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Academics", href: "/academics", icon: GraduationCap },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: "Personnel", href: "/personnel", icon: UserCog },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

/**
 * Per-route placeholder for the header's global search input — the real
 * screens use slightly different copy per page. Falls back to a generic
 * placeholder for routes not listed yet.
 */
export const SEARCH_PLACEHOLDERS: Record<string, string> = {
  "/dashboard": "Search student records, staff or financial data...",
  "/students": "Search students, parents, or staff...",
  "/academics/attendance": "Search student name or ID...",
  "/academics/promotion": "Search student name or ID...",
    "/students/import": "Search students, parents, or staff...",
};
export const DEFAULT_SEARCH_PLACEHOLDER = "Search...";

