/** Mirrors the backend's src/attendance/dto/attendance.dto.ts. */

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** One student's line on a day's register (GET /attendance/register). */
export interface RegisterRow {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  status: AttendanceStatus | null; // null: not marked
  note: string | null;
}

/** GET /attendance/register?classArmId&date, and what PUT returns. */
export interface Register {
  classArmId: string;
  className: string;
  date: string;
  termName: string | null; // null: the date isn't inside any term
  taken: boolean;
  canEdit: boolean; // the backend's verdict: form teacher or academics.update, a term day, not in the future
  students: RegisterRow[];
  present: number; // on time
  absent: number; // unexcused
  late: number;
  excused: number;
}

/** PUT /attendance/register (1-200 entries; students left out stay unmarked). */
export interface SaveRegisterInput {
  classArmId: string;
  date: string; // "YYYY-MM-DD"
  entries: { studentId: string; status: AttendanceStatus; note?: string | null }[];
}

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

/** One bar on an attendance-rate chart. */
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
