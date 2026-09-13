"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, LogOut, Plus } from "lucide-react";
import { EduGearLogo } from "@/components/EduGearLogo";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-gray/10 bg-white">
      <div className="px-5 pb-4 pt-5">
        <EduGearLogo withWordmark />
      </div>
      <div className="px-3 pb-3">
        <Link
          href="/students/new"
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
            <Link key={item.href} href={item.href} className={cn(
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
        <Link href="/support" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-gray hover:bg-cloud-sky/50 hover:text-primary-navy">
          <LifeBuoy className="h-4 w-4" />
          Support
        </Link>
        <button type="button" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-gray hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}