"use client";

import { usePathname } from "next/navigation";
import { Bell, Grid3x3, Search } from "lucide-react";
import { DEFAULT_SEARCH_PLACEHOLDER, SEARCH_PLACEHOLDERS } from "@/lib/nav";

interface HeaderProps {
  userName: string;
  userRole: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

/**
 * Top bar for the authenticated app shell — global search, notifications,
 * and the current user. No breadcrumb: neither the "School Administrator
 * Dashboard - Overview" nor "Students - List View (Desktop)" screen shows
 * one here (page titles are rendered inside each page's own content instead).
 */
export function Header({ userName, userRole }: HeaderProps) {
  const pathname = usePathname();
  const placeholder = SEARCH_PLACEHOLDERS[pathname] ?? DEFAULT_SEARCH_PLACEHOLDER;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-gray/10 bg-white px-6">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-gray/50" />
        <input
          type="search"
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-gray/25 bg-white py-2 pl-9 pr-3 text-sm text-primary-navy placeholder:text-slate-gray/50 focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 text-slate-gray hover:bg-cloud-sky/60 hover:text-primary-navy"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Quick links"
          className="hidden rounded-lg p-2 text-slate-gray hover:bg-cloud-sky/60 hover:text-primary-navy sm:block"
        >
          <Grid3x3 className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 border-l border-slate-gray/10 pl-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-navy text-sm font-semibold text-white">
            {initials(userName)}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-primary-navy">{userName}</p>
            <p className="text-xs text-slate-gray">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}