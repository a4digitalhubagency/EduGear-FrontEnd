"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useArmAttendanceSummaries } from "@/lib/queries/attendance";
import { useClassArms } from "@/lib/queries/academics";
import { useCan } from "@/lib/store/auth-store";

interface AttendanceOverviewCardProps {
  termId: string | undefined;
  termLabel: string | undefined;
}

function percent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/**
 * "Attendance Overview" card on real data: one bar per arm with its attendance rate
 * so far this term, and school-wide present/absent/late shares underneath.
 * The design's Today/Week/Month toggle and weekday bars are gone: the backend only
 * summarises an arm over a whole term, so per-day school-wide figures don't exist yet.
 */
export function AttendanceOverviewCard({ termId, termLabel }: AttendanceOverviewCardProps) {
  // Two separate hook calls: `useCan(a) && useCan(b)` would skip the second hook sometimes.
  const canReadAttendance = useCan("attendance.read");
  const canReadAcademics = useCan("academics.read"); // the arm list
  const canRead = canReadAttendance && canReadAcademics;
  const arms = useClassArms();
  const armList = canRead ? (arms.data?.data ?? []) : [];
  const summaries = useArmAttendanceSummaries(termId, armList.map((arm) => arm.id), canRead);

  // Per arm: present ÷ register-days across its students ("present" already includes late).
  const bars = armList
    .map((arm, index) => {
      const rows = summaries[index]?.data ?? [];
      const daysOpen = rows.reduce((sum, row) => sum + row.daysOpen, 0);
      return { arm, daysOpen, rate: percent(rows.reduce((sum, row) => sum + row.present, 0), daysOpen) };
    })
    .filter((bar) => bar.daysOpen > 0); // arms with no registers yet would just be empty bars

  const totals = summaries.reduce(
    (acc, query) => {
      for (const row of query.data ?? []) {
        acc.daysOpen += row.daysOpen;
        acc.present += row.present - row.late; // on time
        acc.absent += row.absent;
        acc.late += row.late;
      }
      return acc;
    },
    { daysOpen: 0, present: 0, absent: 0, late: 0 },
  );

  const loading = canRead && (arms.isPending || (!!termId && summaries.some((q) => q.isPending)));
  const failed = arms.isError || summaries.some((q) => q.isError);

  let body: React.ReactNode;
  if (!canRead) {
    body = <p className="text-sm text-slate-gray">You don&apos;t have access to attendance records.</p>;
  } else if (!termId) {
    body = (
      <p className="text-sm text-slate-gray">
        No current term is set.{" "}
        <Link href="/academics/setup" className="font-semibold text-bright-blue hover:underline">
          Set one in Academic Setup
        </Link>{" "}
        to see attendance here.
      </p>
    );
  } else if (loading) {
    body = (
      <p className="inline-flex items-center gap-2 text-sm text-slate-gray">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading attendance...
      </p>
    );
  } else if (failed) {
    body = <p className="text-sm text-slate-gray">Couldn&apos;t load attendance. Refresh to try again.</p>;
  } else if (bars.length === 0) {
    body = (
      <p className="text-sm text-slate-gray">
        No registers have been taken this term yet.{" "}
        <Link href="/academics/attendance" className="font-semibold text-bright-blue hover:underline">
          Take a register
        </Link>
      </p>
    );
  } else {
    body = (
      <>
        <div className="mt-6 flex h-40 items-end justify-between gap-3 overflow-x-auto">
          {bars.map((bar, index) => (
            <div key={bar.arm.id} className="flex min-w-10 flex-1 flex-col items-center gap-2" title={`${bar.arm.fullName}: ${bar.rate}%`}>
              <span className="text-[10px] font-semibold text-primary-navy">{bar.rate}%</span>
              <div className="flex h-28 w-full items-end">
                <div
                  // Bars rise from the baseline one after another.
                  className="w-full origin-bottom animate-grow-y rounded-t-md bg-primary-navy"
                  style={{ height: `${bar.rate}%`, animationDelay: `${index * 50}ms` }}
                />
              </div>
              <span className="whitespace-nowrap text-[10px] font-semibold text-slate-gray">{bar.arm.fullName}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-gray/10 pt-4 text-center">
          <div>
            <p className="text-lg font-bold text-green-600">{percent(totals.present, totals.daysOpen)}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Present</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{percent(totals.absent, totals.daysOpen)}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Absent</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{percent(totals.late, totals.daysOpen)}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Late</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="h-full rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Attendance Overview</h2>
      <p className="mb-3 text-xs text-slate-gray">
        Attendance rate per arm{termLabel ? `, ${termLabel} so far` : ""}
      </p>
      {body}
    </div>
  );
}
