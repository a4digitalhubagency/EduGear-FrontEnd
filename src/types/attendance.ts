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
// --- API types (mirror the backend's src/attendance/dto/attendance.dto.ts) ---
// The mock-era types above stay until the attendance screens move to the API.

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

/** GET /attendance/summary row: one student's attendance over a term. */
export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  daysOpen: number; // days a register included this student
  present: number; // includes late
  absent: number; // includes excused
  late: number;
  excused: number;
  rate: number; // present / daysOpen, 0-100
}

/** GET /attendance/students/:studentId?termId */
export interface StudentTermAttendance {
  summary: Omit<StudentAttendanceSummary, "studentId" | "studentName" | "admissionNumber">;
  records: { date: string; status: AttendanceStatus; note: string | null }[];
}
