import { z } from "zod";
import { WEEKDAYS } from "@/types/school";
import { NG_PHONE_MESSAGE, NG_PHONE_REGEX, PREFIX_REGEX } from "@/lib/validation/common";

/** Mirrors UpdateSchoolDto. Optional text fields may be left empty (they're then not sent). */
export const schoolProfileSchema = z.object({
  name: z.string().trim().min(2, "School name is required").max(150),
  shortName: z.string().trim().max(20, "Keep it under 20 characters"),
  email: z.string().trim().email("Enter a valid email address").max(180),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || NG_PHONE_REGEX.test(v), NG_PHONE_MESSAGE),
  addressLine: z.string().trim().max(255),
  city: z.string().trim().max(80),
  state: z.string().trim().max(80),
  motto: z.string().trim().max(180),
});

export type SchoolProfileValues = z.infer<typeof schoolProfileSchema>;

const dayCount = (max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= max), `${label} must be a whole number from 0 to ${max}`);

/** Mirrors UpdateSchoolSettingsDto. Number fields are text so "empty" can mean null. */
export const schoolSettingsSchema = z.object({
  admissionNumberPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || PREFIX_REGEX.test(v), "Use 1–10 letters, digits or hyphens, e.g. BSC"),
  receiptPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => PREFIX_REGEX.test(v), "Use 1–10 letters, digits or hyphens, e.g. RCP"),
  portalEnabled: z.boolean(),
  reminderCooldownDays: dayCount(90, "Cooldown").refine((v) => v !== "", "Cooldown is required"),
  invoiceDueDays: dayCount(365, "Days to pay"),
  reportShowPosition: z.boolean(),
  reportShowClassStats: z.boolean(),
  schoolDays: z.array(z.enum(WEEKDAYS)).min(1, "Pick at least one school day"),
});

export type SchoolSettingsValues = z.infer<typeof schoolSettingsSchema>;
