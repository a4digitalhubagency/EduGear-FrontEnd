export type AttendanceMark = "present" | "absent" | "late" | "excused";

export interface AttendanceEntry {
  id: string;
  name: string;
  gender: "Male" | "Female";
  /**
   * This screen's own ID format in the Stitch mock (e.g. "ADS-25-082") —
   * distinct from the "EDU-####" IDs used on the Students screens. Kept as
   * shown in the design rather than reconciled with the Students module;
   * see the note in docs/ARCHITECTURE.md.
   */
  displayId: string;
  previousDayStatus: AttendanceMark | null;
  status: AttendanceMark | null;
}

export interface AttendanceRegister {
  className: string;
  arm: string;
  date: string; // yyyy-mm-dd, matches a native <input type="date">
  status: "draft" | "completed";
  submittedBy?: string;
  submittedAt?: string;
  entries: AttendanceEntry[];
}
/** One point on an Attendance Reports trend chart (the 30-day trend or the weekly mini-chart). */
export interface AttendanceTrendPoint {
  label: string;
  rate: number; // 0-100
}

/** One "Requires Attention" item on the Attendance Reports screen. */
export interface AttendanceAlert {
  id: string;
  severity: "critical" | "warning";
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}