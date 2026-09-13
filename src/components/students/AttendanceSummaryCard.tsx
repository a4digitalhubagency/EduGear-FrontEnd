import type { StudentAttendanceSummary } from "@/types/student";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * "Attendance" card on the Student Profile Overview tab — a green progress
 * ring with the attendance % in the middle, plus the Present/Absent/Late
 * counts below it (e.g. "142 P · 6 A · 3 L").
 */
export function AttendanceSummaryCard({ attendance }: { attendance: StudentAttendanceSummary }) {
  const offset = CIRCUMFERENCE * (1 - attendance.percent / 100);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#E7EEFE" strokeWidth="6" />
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
          />
        </svg>
        <span className="absolute text-sm font-bold text-primary-navy">{attendance.percent}%</span>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-gray">Attendance</p>
        <p className="mt-1 text-xs text-slate-gray">
          <span className="font-semibold text-primary-navy">{attendance.present}P</span>
          {" · "}
          <span className="font-semibold text-primary-navy">{attendance.absent}A</span>
          {" · "}
          <span className="font-semibold text-primary-navy">{attendance.late}L</span>
        </p>
      </div>
    </div>
  );
}