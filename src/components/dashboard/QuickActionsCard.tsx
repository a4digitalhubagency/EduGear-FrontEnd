"use client";

import Link from "next/link";
import { ChevronRight, Megaphone, PencilLine, Receipt, UserPlus } from "lucide-react";

const ACTIONS = [
  { label: "Add Student", icon: UserPlus, href: "/students/new" },
  { label: "Record Payment", icon: Receipt, href: "/finance?tab=payments&record=1" },
  { label: "Announce", icon: Megaphone, href: null },
  { label: "Enter Results", icon: PencilLine, href: null },
];

const FREQUENTLY_USED = ["Generate Termly Reports", "Export Staff Payroll"];

function SoonBadge() {
  return (
    <span className="rounded-full bg-slate-gray/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-gray">
      Coming Soon
    </span>
  );
}

/**
 * "Quick Actions" card. "Add Student" and "Record Payment" (straight into the Finance
 * record-payment form) are real. The rest render as disabled "Coming Soon" tiles, same
 * treatment as the Academics hub's Gradebook card, rather than buttons that do nothing:
 * - Announce: the backend has no announcements endpoint yet.
 * - Enter Results / Generate Termly Reports: the backend supports results and report
 *   cards, but the Results screens aren't built yet.
 * - Export Staff Payroll: payroll doesn't exist in the backend.
 */
export function QuickActionsCard() {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Quick Actions</h2>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return action.href ? (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center justify-center rounded-lg bg-cloud-sky/50 px-3 py-4 text-center hover:bg-cloud-sky"
            >
              <Icon className="h-5 w-5 text-bright-blue" />
              <span className="mt-1.5 text-xs font-semibold text-primary-navy">{action.label}</span>
            </Link>
          ) : (
            <div
              key={action.label}
              aria-disabled="true"
              title="Coming soon"
              className="flex cursor-not-allowed flex-col items-center justify-center rounded-lg bg-slate-gray/5 px-3 py-4 text-center opacity-60"
            >
              <Icon className="h-5 w-5 text-slate-gray" />
              <span className="mt-1.5 text-xs font-semibold text-slate-gray">{action.label}</span>
              <span className="mt-1">
                <SoonBadge />
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">
        Frequently Used
      </p>
      <div className="mt-2 space-y-1.5">
        {FREQUENTLY_USED.map((item) => (
          <div
            key={item}
            aria-disabled="true"
            title="Coming soon"
            className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-slate-gray/10 px-3 py-2 text-xs font-medium text-slate-gray opacity-60"
          >
            {item}
            <span className="flex items-center gap-1.5">
              <SoonBadge />
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
