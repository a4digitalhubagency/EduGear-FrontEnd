import { z } from "zod";
import { NG_PHONE_MESSAGE, NG_PHONE_REGEX } from "./common";

/** Login form schema — School Email Address + Password, matching the Login screen. */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "School email address is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Forgot Password form schema — just the school email address. */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "School email address is required")
    .email("Please enter a valid school email address"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

/**
 * The backend password policy (PasswordService.assertMeetsPolicy): 10-128 characters,
 * at least one letter and one number. It also refuses very common passwords, which only
 * the server can check, so that one shows up as a server error instead.
 */
export const PASSWORD_REQUIREMENTS: { label: string; test: (value: string) => boolean }[] = [
  { label: "At least 10 characters", test: (v) => v.length >= 10 },
  { label: "At least one letter", test: (v) => /[a-zA-Z]/.test(v) },
  { label: "At least one number", test: (v) => /\d/.test(v) },
];

export const newPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use at most 128 characters")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

/** Reset Password form schema: new password + confirmation, matching the Reset Password screen. */
export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const optionalPhone = z.string().trim().refine((v) => v === "" || NG_PHONE_REGEX.test(v), NG_PHONE_MESSAGE);

/** School sign-up: mirrors the backend's RegisterSchoolDto (POST /auth/register-school). */
export const registerSchoolSchema = z
  .object({
    schoolName: z.string().trim().min(2, "Enter the school's name").max(150),
    schoolEmail: z.string().trim().min(1, "Enter the school's email").email("Enter a valid email address").max(180),
    schoolPhone: optionalPhone,
    city: z.string().trim().max(80),
    state: z.string().trim().max(80),
    firstName: z.string().trim().min(1, "Enter your first name").max(60),
    lastName: z.string().trim().min(1, "Enter your last name").max(60),
    email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address").max(180),
    phone: optionalPhone,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export type RegisterSchoolValues = z.infer<typeof registerSchoolSchema>;