"use client";

import { useStudentAttendance } from "@/lib/queries/student-records";
import { useCan } from "@/lib/store/auth-store";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface AttendanceSummaryCardProps {
  studentId: string;
  termId: string | undefined;
  termLabel: string | undefined;
}

/**
 * "Attendance" card on the Student Profile Overview tab: a green ring with the term's
 * attendance rate, and Present/Absent/Late counts (GET /attendance/students/:id).
 */
export function AttendanceSummaryCard({ studentId, termId, termLabel }: AttendanceSummaryCardProps) {
  const canRead = useCan("attendance.read");
  const attendance = useStudentAttendance(studentId, termId, canRead);
  const summary = attendance.data?.summary;
  const hasRecords = !!summary && summary.daysOpen > 0;
  const percent = hasRecords ? Math.round(summary.rate) : 0;
  const offset = CIRCUMFERENCE * (1 - percent / 100);

  let detail: React.ReactNode;
  if (!canRead) detail = "No access to attendance.";
  else if (!termId) detail = "No current term set.";
  else if (attendance.isPending) detail = "Loading...";
  else if (attendance.isError) detail = "Couldn't load attendance.";
  else if (!hasRecords) detail = `No registers yet${termLabel ? ` in ${termLabel}` : ""}.`;
  else
    detail = (
      <>
        <span className="font-semibold text-primary-navy">{summary.present - summary.late}P</span>
        {" · "}
        <span className="font-semibold text-primary-navy">{summary.absent}A</span>
        {" · "}
        <span className="font-semibold text-primary-navy">{summary.late}L</span>
        <span className="block">of {summary.daysOpen} days{termLabel ? `, ${termLabel}` : ""}</span>
      </>
    );

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#E7EEFE" strokeWidth="6" />
          {hasRecords && (
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke="#22C55E"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              // Draws round from empty to the rate (ring-fill reads the empty offset from --ring-empty).
              className="animate-ring-fill"
              style={{ "--ring-empty": CIRCUMFERENCE } as React.CSSProperties}
            />
          )}
        </svg>
        <span className="absolute text-sm font-bold text-primary-navy">{hasRecords ? `${percent}%` : "—"}</span>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-gray">Attendance</p>
        <p className="mt-1 text-xs text-slate-gray">{detail}</p>
      </div>
    </div>
  );
}
