import { z } from "zod";
import { NG_PHONE_MESSAGE, NG_PHONE_REGEX } from "@/lib/validation/common";

const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || NG_PHONE_REGEX.test(v), NG_PHONE_MESSAGE);

/** Mirrors InviteUserDto. Empty optional fields are left out of the request. */
export const inviteStaffSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  roleId: z.string().min(1, "Select a role"),
  phone: optionalPhone,
  staffId: z.string().trim().max(40),
});

export type InviteStaffValues = z.infer<typeof inviteStaffSchema>;

/** Mirrors UpdateMembershipDto. */
export const editStaffSchema = z.object({
  roleId: z.string().min(1, "Select a role"),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  staffId: z.string().trim().max(40),
});

export type EditStaffValues = z.infer<typeof editStaffSchema>;
