import { z } from "zod";

export const GENDER_OPTIONS = ["Male", "Female"] as const;
export const TERM_OPTIONS = ["First Term", "Second Term", "Third Term"] as const;
export const RELATIONSHIP_OPTIONS = ["Father", "Mother", "Guardian", "Other"] as const;
export const BLOOD_GROUP_OPTIONS = [
  "Unknown",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export const ACADEMIC_SESSION_OPTIONS = ["2023/2024", "2024/2025"] as const;

/**
 * "Add Student - Form (Desktop)" screen — "New Admission" form. Sections:
 * Personal Information, Enrollment, Medical (Optional), Parent/Guardian
 * Information. Fields marked "*" in the design are required here; Medical
 * section fields are all optional, matching the screen's own "(Optional)" label.
 */
export const addStudentSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Select a gender"),
  nationality: z.string().min(1, "Nationality is required"),
  stateOfOrigin: z.string().min(1, "State of origin is required"),

  // Enrollment
  academicSession: z.string().min(1, "Academic session is required"),
  term: z.string().min(1, "Select a term"),
  classArm: z.string().min(1, "Class/Arm is required"),
  admissionDate: z.string().min(1, "Admission date is required"),

  // Medical (Optional)
  bloodGroup: z.string().optional(),
  allergiesConditions: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyPhone: z.string().optional(),

  // Parent/Guardian Information
  guardianFullName: z.string().min(1, "Guardian full name is required"),
  relationship: z.string().min(1, "Select a relationship"),
  guardianPhone: z.string().min(1, "Guardian phone number is required"),
  guardianEmail: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  residentialAddress: z.string().min(1, "Residential address is required"),
});

export type AddStudentValues = z.infer<typeof addStudentSchema>;