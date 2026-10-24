"use client";

import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { AttentionMenu, ProfileMenu, QuickLinksMenu } from "@/components/layout/HeaderMenus";

/**
 * Top bar for the authenticated app shell: search across students and staff, the
 * needs-attention bell, quick links, and the account menu. No breadcrumb: neither the
 * "School Administrator Dashboard - Overview" nor "Students - List View (Desktop)"
 * screen shows one here (page titles are rendered inside each page's own content instead).
 */
export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-gray/10 bg-white px-6">
      <HeaderSearch />
      <div className="flex items-center gap-2">
        <AttentionMenu />
        <QuickLinksMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
