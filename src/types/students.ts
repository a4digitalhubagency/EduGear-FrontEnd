import type { PageQuery } from "./api";
import type { GuardianRelationship } from "./guardians";

/**
 * Mirrors the backend's src/students/dto/student.dto.ts. Replaces the mock-era
 * types in ./student.ts, which stay only until every page has moved over.
 */

export const GENDERS = ["MALE", "FEMALE"] as const;
export type Gender = (typeof GENDERS)[number];

export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "WITHDRAWN"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

/** A guardian as embedded in a student profile (link fields plus contact basics). */
export type StudentGuardianSummary = {
  guardianId: string;
  fullName: string;
  phone: string;
  email: string | null;
  relationship: GuardianRelationship;
  isPrimary: boolean;
  canPickUp: boolean;
};

export type Student = {
  id: string;
  studentId: string; // admission number, e.g. "2025/0001"; immutable after admission
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string; // "Obi, Ada N." for list display
  gender: Gender;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  photoUrl: string | null; // "/api/files/:id", needs the Bearer token, see useFileUrl
  admissionDate: string;
  status: StudentStatus;
  classArmId: string | null;
  className: string | null; // "JSS1 A"
  bloodGroup: string | null;
  genotype: string | null;
  stateOfOrigin: string | null;
  lga: string | null;
  nationality: string;
  religion: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** GET /students/:id. Everything in Student plus the guardians. */
export type StudentProfile = Student & { guardians: StudentGuardianSummary[] };

/** Profile fields shared by admission and update. null clears a nullable field. */
type StudentProfileFields = {
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: Gender;
  dateOfBirth: string | null; // "YYYY-MM-DD"
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  bloodGroup: string | null;
  genotype: string | null;
  stateOfOrigin: string | null;
  lga: string | null;
  nationality: string;
  religion: string | null;
  notes: string | null;
};

/** POST /students. firstName, lastName, gender and admissionDate are required. */
export type AdmitStudentInput = Partial<StudentProfileFields> &
  Pick<StudentProfileFields, "firstName" | "lastName" | "gender"> & {
    admissionDate: string;
    studentId?: string; // generated per school when omitted
    classArmId?: string;
  };

/** PATCH /students/:id. No studentId (immutable) and no status (own endpoint). */
export type UpdateStudentInput = Partial<StudentProfileFields> & {
  classArmId?: string | null; // null unassigns the student from their arm
  admissionDate?: string;
};

/** PATCH /students/:id/status. reason is recorded on the audit entry. */
export type ChangeStudentStatusInput = { status: StudentStatus; reason?: string };

/** GET /students query. status defaults to ACTIVE on the backend; "ALL" includes every status. */
export type StudentsQuery = PageQuery & {
  status?: StudentStatus | "ALL";
  classId?: string;
  classArmId?: string;
  gender?: Gender;
  unassigned?: boolean;
  sortBy?: "lastName" | "firstName" | "studentId" | "admissionDate" | "createdAt";
};
