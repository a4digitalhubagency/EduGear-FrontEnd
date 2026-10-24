"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2, LogOut } from "lucide-react";
import { EduGearLogo } from "@/components/EduGearLogo";
import { PageTransition } from "@/components/layout/PageTransition";
import { logout } from "@/lib/auth-actions";
import { usePortalMe } from "@/lib/queries/portal";
import { useAuthStore } from "@/lib/store/auth-store";

/**
 * The parent portal's frame: a single top bar (school, notifications, sign out) over a
 * narrow centred column. Mobile-first on purpose: most parents will use a phone, and
 * the portal has a handful of pages, so the staff sidebar would only get in the way.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = usePortalMe();
  const firstName = useAuthStore((s) => s.user?.firstName);
  const [signingOut, setSigningOut] = useState(false);
  const unread = me.data?.unreadNotifications ?? 0;

  async function handleLogout() {
    setSigningOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-gray/10 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/portal" className="flex min-w-0 items-center gap-2.5">
            <EduGearLogo />
            <span className="truncate text-sm font-bold text-primary-navy">{me.data?.schoolName ?? "Parent Portal"}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/portal/notifications"
              aria-label={`Notifications (${unread} unread)`}
              className="relative rounded-lg p-2 text-slate-gray hover:bg-cloud-sky/60 hover:text-primary-navy"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-gray hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        {firstName && <p className="sr-only">Signed in as {firstName}</p>}
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
