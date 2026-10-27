"use client";

import { Menu } from "lucide-react";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { AttentionMenu, ProfileMenu, QuickLinksMenu } from "@/components/layout/HeaderMenus";

/**
 * Top bar for the authenticated app shell: search across students and staff, the
 * needs-attention bell, quick links, and the account menu. No breadcrumb: neither the
 * "School Administrator Dashboard - Overview" nor "Students - List View (Desktop)"
 * screen shows one here (page titles are rendered inside each page's own content instead).
 * Below lg it also carries the button that opens the navigation drawer.
 */
export function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-gray/10 bg-white px-3 sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="shrink-0 rounded-lg p-2 text-slate-gray hover:bg-slate-100 hover:text-primary-navy lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <HeaderSearch />
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <AttentionMenu />
        <QuickLinksMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
