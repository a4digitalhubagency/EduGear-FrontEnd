"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LifeBuoy, Loader2, LogOut, Plus, X } from "lucide-react";
import { EduGearLogo } from "@/components/EduGearLogo";
import { logout } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";

/** The nav itself, shared by the desktop sidebar and the phone drawer. onNavigate closes the drawer. */
function SidebarContent({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    // logout() never throws: it clears the session locally even if the server call fails.
    await logout();
    router.replace("/login");
  }
  return (
    <>
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <EduGearLogo withWordmark />
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-md p-1.5 text-slate-gray hover:bg-slate-100 hover:text-primary-navy">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="px-3 pb-3">
        <Link
          href="/students/new"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-navy px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-navy/90"
        >
          <Plus className="h-4 w-4" />
          New Admission
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={cn(
              "flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "border-bright-blue bg-cloud-sky text-bright-blue" : "text-slate-gray hover:bg-cloud-sky/50 hover:text-primary-navy",
            )}>
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-slate-gray/10 px-3 py-3">
        <Link href="/support" onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-gray hover:bg-cloud-sky/50 hover:text-primary-navy">
          <LifeBuoy className="h-4 w-4" />
          Support
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-gray hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        >
          {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {signingOut ? "Signing out..." : "Log Out"}
        </button>
      </div>
    </>
  );
}

/**
 * Fixed sidebar from lg up; below that, a slide-in drawer opened by the header's menu button.
 * The drawer closes on a link tap, the backdrop, or Escape.
 */
export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onClose]);

  return (
    <>
      <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-gray/10 bg-white lg:flex">
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 animate-fade-in bg-primary-navy/40" onClick={onClose} />
          <aside className="relative flex h-full w-72 max-w-[85vw] animate-drawer-in flex-col bg-white shadow-xl">
            <SidebarContent onNavigate={onClose} onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
