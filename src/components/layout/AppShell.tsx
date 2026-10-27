"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PageTransition } from "@/components/layout/PageTransition";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Authenticated app layout — flat sidebar nav + header, confirmed against
 * the "School Administrator Dashboard - Overview" and "Students - List View
 * (Desktop)" Stitch screens (see docs/ARCHITECTURE.md §3.4 for the
 * discrepancy this corrects). `children` renders in the scrollable content area.
 * The header reads the signed-in user from the auth store itself.
 *
 * Below lg (1024px) the sidebar becomes a drawer opened from the header's menu
 * button, so phones and tablets get the full width for the page.
 */
export function AppShell({ children }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
