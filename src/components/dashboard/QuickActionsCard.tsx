"use client";

import Link from "next/link";
import { ChevronRight, Megaphone, PencilLine, Receipt, UserPlus } from "lucide-react";

const ACTIONS = [
  { label: "Add Student", icon: UserPlus, href: "/students/new" },
  { label: "Record Payment", icon: Receipt, href: null },
  { label: "Announce", icon: Megaphone, href: null },
  { label: "Enter Results", icon: PencilLine, href: null },
];

const FREQUENTLY_USED = ["Generate Termly Reports", "Export Staff Payroll"];

/**
 * "Quick Actions" card. Only "Add Student" has a real route today — the
 * others (Finance, Communication, Academics modules) aren't built yet, so
 * they render as inert buttons rather than linking anywhere.
 */
export function QuickActionsCard() {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Quick Actions</h2>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <Icon className="h-5 w-5 text-bright-blue" />
              <span className="mt-1.5 text-xs font-semibold text-primary-navy">{action.label}</span>
            </>
          );
          const className =
            "flex flex-col items-center justify-center rounded-lg bg-cloud-sky/50 px-3 py-4 text-center hover:bg-cloud-sky";

          return action.href ? (
            <Link key={action.label} href={action.href} className={className}>
              {content}
            </Link>
          ) : (
            <button key={action.label} type="button" className={className}>
              {content}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">
        Frequently Used
      </p>
      <div className="mt-2 space-y-1.5">
        {FREQUENTLY_USED.map((item) => (
          <button
            key={item}
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-slate-gray/10 px-3 py-2 text-left text-xs font-medium text-primary-navy hover:bg-cloud-sky/40"
          >
            {item}
            <ChevronRight className="h-3.5 w-3.5 text-slate-gray" />
          </button>
        ))}
      </div>
    </div>
  );
}