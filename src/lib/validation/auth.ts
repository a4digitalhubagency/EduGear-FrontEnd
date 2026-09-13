import { z } from "zod";

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

/** Reset Password form schema — new password + confirmation, matching the Reset Password screen. */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;