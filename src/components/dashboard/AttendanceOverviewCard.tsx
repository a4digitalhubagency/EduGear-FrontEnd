"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = ["Today", "Week", "Month"] as const;
type Tab = (typeof TABS)[number];

// Illustrative bar heights (%) for Mon-Fri — the design doesn't label axis
// values, so these are proportions, not real figures. Same caveat as the
// old AttendanceTrendsCard this replaces.
const BARS: { day: string; heightPercent: number }[] = [
  { day: "MON", heightPercent: 70 },
  { day: "TUE", heightPercent: 85 },
  { day: "WED", heightPercent: 60 },
  { day: "THU", heightPercent: 95 },
  { day: "FRI", heightPercent: 80 },
];

/**
 * "Attendance Overview" card. The Today/Week/Month tabs are a visual toggle
 * only — there's one illustrative dataset behind all three for now, since
 * the design doesn't show what Week/Month data looks like.
 */
export function AttendanceOverviewCard() {
  const [activeTab, setActiveTab] = useState<Tab>("Today");

  return (
    <div className="h-full rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-primary-navy">Attendance Overview</h2>
          <p className="text-xs text-slate-gray">Tracking daily presence across all arms</p>
        </div>

        <div className="flex rounded-lg bg-cloud-sky/60 p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                activeTab === tab
                  ? "bg-white text-primary-navy shadow-sm"
                  : "text-slate-gray hover:text-primary-navy",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex h-40 items-end justify-between gap-3">
        {BARS.map((bar) => (
          <div key={bar.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end">
              <div
                className="w-full rounded-t-md bg-primary-navy"
                style={{ height: `${bar.heightPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-gray">{bar.day}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-gray/10 pt-4 text-center">
        <div>
          <p className="text-lg font-bold text-green-600">94%</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Present</p>
        </div>
        <div>
          <p className="text-lg font-bold text-red-600">4%</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Absent</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-600">2%</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Late</p>
        </div>
      </div>
    </div>
  );
}