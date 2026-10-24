import type { GuardianRelationship } from "@/types/guardians";
import type { Gender, StudentStatus } from "@/types/students";

/** Display labels for the backend's enum values. */

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  GRADUATED: "Graduated",
  TRANSFERRED: "Transferred",
  WITHDRAWN: "Withdrawn",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
};

export const RELATIONSHIP_LABELS: Record<GuardianRelationship, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
  GRANDPARENT: "Grandparent",
  SIBLING: "Sibling",
  UNCLE: "Uncle",
  AUNT: "Aunt",
  OTHER: "Other",
};
