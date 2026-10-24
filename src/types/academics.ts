/**
 * Mirrors the backend DTOs in src/academics/dto/*.dto.ts. Dates arrive as ISO
 * strings over JSON ("2025-09-15T00:00:00.000Z"); date-only fields are sent
 * back as "YYYY-MM-DD".
 */

export type AcademicSession = {
  id: string;
  name: string; // "2025/2026"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  termCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateAcademicSessionInput = {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
};

export type UpdateAcademicSessionInput = Partial<Omit<CreateAcademicSessionInput, "isCurrent">>;

export const TERM_NAMES = ["FIRST", "SECOND", "THIRD"] as const;
export type TermName = (typeof TERM_NAMES)[number];

export type Term = {
  id: string;
  sessionId: string;
  sessionName: string;
  name: TermName;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTermInput = {
  sessionId: string;
  name: TermName;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
};

/** sessionId is not editable: a term can't move between sessions. */
export type UpdateTermInput = Partial<Omit<CreateTermInput, "sessionId" | "isCurrent">>;

export type SchoolClass = {
  id: string;
  name: string; // "JSS1"
  level: number; // 1-20, unique per school; promotion steps through it
  armCount: number;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateClassInput = { name: string; level: number };
export type UpdateClassInput = Partial<CreateClassInput>;

export const MAX_ARM_CAPACITY = 500;

export type ClassArm = {
  id: string;
  classId: string;
  className: string;
  classLevel: number;
  name: string; // "A"
  fullName: string; // "JSS1 A"
  capacity: number | null;
  formTeacherId: string | null; // a staff membershipId
  formTeacherName: string | null;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateClassArmInput = {
  classId: string;
  name: string;
  capacity?: number;
  formTeacherId?: string;
};

/** classId is not editable: an arm can't move between classes. null clears a field. */
export type UpdateClassArmInput = {
  name?: string;
  capacity?: number | null;
  formTeacherId?: string | null;
};
