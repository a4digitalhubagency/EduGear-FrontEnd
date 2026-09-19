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

/** One guardian entry on the Student Profile's Guardians tab. A student can have more than one. */
export interface Guardian {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  isPrimary: boolean;
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
  term: string; // e.g. "Second Term" — used by Edit Student, not shown on the Overview tab
  guardianRelationship: string;
  guardianEmail: string;
  bloodGroup: string; // e.g. "O+" — used by Edit Student
  knownAllergies: string; // e.g. "No known allergies" — used by Edit Student
  /** Full guardian list for the Guardians tab. guardians[0] is generally the same person as guardianName/guardianRelationship/phone/guardianEmail above — those singular fields stay in place for the Overview tab and Edit Student, which predate multi-guardian support. */
  guardians: Guardian[];
  attendance: StudentAttendanceSummary;
  finance: StudentFinanceSummary;
  academicPerformance: StudentAcademicPerformance;
  recentActivity: StudentActivityEntry[];
}