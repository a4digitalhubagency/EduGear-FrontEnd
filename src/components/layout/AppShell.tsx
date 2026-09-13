import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface AppShellProps {
  children: ReactNode;
}

// TODO: replace with the authenticated user/session once auth is wired up
// (see docs/ARCHITECTURE.md §4 — this is placeholder data, not a real
// logged-in user. Kept as one consistent mock user across every screen,
// rather than copying each Stitch screen's own inconsistent mock name.)
const CURRENT_USER = {
  name: "Dr. Ahmad Bello",
  role: "School Administrator",
};

/**
 * Authenticated app layout — flat sidebar nav + header, confirmed against
 * the "School Administrator Dashboard - Overview" and "Students - List View
 * (Desktop)" Stitch screens (see docs/ARCHITECTURE.md §3.4 for the
 * discrepancy this corrects). `children` renders in the scrollable content area.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header userName={CURRENT_USER.name} userRole={CURRENT_USER.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}