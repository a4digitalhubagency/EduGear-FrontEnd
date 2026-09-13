export type StudentStatus = "active" | "inactive" | "graduated" | "pending" | "on_leave";

export interface Student {
  id: string;
  studentId: string; // e.g. "EDU-00124"
  name: string;
  email: string;
  className: string; // e.g. "SS 2A"
  gender: "Male" | "Female";
  guardianName: string;
  phone: string; // guardian's phone — the profile's Guardian Details card confirms this, students here don't carry their own
  status: StudentStatus;
}

/** Present/Absent/Late breakdown shown on the Student Profile's Attendance card. */
export interface StudentAttendanceSummary {
  percent: number;
  present: number;
  absent: number;
  late: number;
}

/** Fee status shown on the Student Profile's Finance Overview card. */
export interface StudentFinanceSummary {
  status: "Fully Paid" | "Balance Due";
  totalFee: string; // pre-formatted, e.g. "₦450k"
  paid: string;
  balance: string;
}

/** Term average/position shown on the Student Profile's Academic Performance card. */
export interface StudentAcademicPerformance {
  term: string; // e.g. "2nd Term"
  average: number; // e.g. 78.4
  position: string; // e.g. "4th in class"
}

export interface StudentActivityEntry {
  label: string;
  detail: string;
}

/**
 * Everything the Student Profile ("Overview" tab) screen needs, beyond the
 * fields already on Student. Extends Student rather than duplicating its
 * fields, since the profile page and the Students list describe the same
 * underlying record — just with more detail than the table shows.
 */
export interface StudentProfile extends Student {
  dateOfBirth: string;
  admissionDate: string;
  academicSession: string;
  guardianRelationship: string;
  guardianEmail: string;
  attendance: StudentAttendanceSummary;
  finance: StudentFinanceSummary;
  academicPerformance: StudentAcademicPerformance;
  recentActivity: StudentActivityEntry[];
}