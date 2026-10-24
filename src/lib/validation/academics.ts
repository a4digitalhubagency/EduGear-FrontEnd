import { z } from "zod";
import { MAX_ARM_CAPACITY, TERM_NAMES } from "@/types/academics";

/**
 * Client-side mirrors of the academics DTO rules, so most mistakes are caught before a
 * round trip. The backend stays the authority (overlapping dates, duplicate names, etc.).
 * Dates are "YYYY-MM-DD" strings from <input type="date">, which compare correctly as text.
 */

const requiredDate = (label: string) => z.string().min(1, `${label} is required`);

const endAfterStart = {
  check: (v: { startDate: string; endDate: string }) => v.endDate > v.startDate,
  params: { path: ["endDate"], message: "End date must be after the start date" },
};

/** "2025/2026": two consecutive years, as CreateAcademicSessionDto describes it. */
function isSessionName(value: string) {
  const match = /^(\d{4})\/(\d{4})$/.exec(value);
  return !!match && Number(match[2]) === Number(match[1]) + 1;
}

export const sessionFormSchema = z
  .object({
    name: z.string().trim().refine(isSessionName, "Use two consecutive years, e.g. 2025/2026"),
    startDate: requiredDate("Start date"),
    endDate: requiredDate("End date"),
    isCurrent: z.boolean(),
  })
  .refine(endAfterStart.check, endAfterStart.params);

export type SessionFormValues = z.infer<typeof sessionFormSchema>;

export const termFormSchema = z
  .object({
    sessionId: z.string().min(1, "Select a session"),
    name: z.enum(TERM_NAMES, { error: "Select a term" }),
    startDate: requiredDate("Start date"),
    endDate: requiredDate("End date"),
    isCurrent: z.boolean(),
  })
  .refine(endAfterStart.check, endAfterStart.params);

export type TermFormValues = z.infer<typeof termFormSchema>;

export const classFormSchema = z.object({
  name: z.string().trim().min(1, "Class name is required").max(40, "Keep it under 40 characters"),
  // registered with valueAsNumber, so an empty field arrives as NaN and fails here
  level: z
    .number({ error: "Enter a level from 1 to 20" })
    .int("Level must be a whole number")
    .min(1, "Enter a level from 1 to 20")
    .max(20, "Enter a level from 1 to 20"),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;

export const armFormSchema = z.object({
  name: z.string().trim().min(1, "Arm name is required").max(40, "Keep it under 40 characters"),
  // Kept as text so "empty" (no limit) is distinguishable from a number; converted on submit.
  capacity: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= MAX_ARM_CAPACITY),
      `Capacity must be between 1 and ${MAX_ARM_CAPACITY}`,
    ),
  formTeacherId: z.string(), // "" means no form teacher
});

export type ArmFormValues = z.infer<typeof armFormSchema>;
