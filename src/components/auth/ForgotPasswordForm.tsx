"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, X } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../../lib/validation/auth";

/**
 * Forgot Password form — covers the "Forgot Password - Default State" and
 * "- Success State" screens from the Stitch design system. The "- Interaction
 * States" card is an internal reference (loading / validation error / system
 * failure) rather than its own screen, so those states are folded in here:
 * loading -> Button's isLoading, validation -> per-field `error`, system
 * failure -> the dismissible banner below.
 */
export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setBannerError(null);
    try {
      // TODO: wire up to the real EduGear auth endpoint (see docs/ARCHITECTURE.md §4.2).
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok && res.status >= 500) {
        throw new Error(
          "Unable to send reset link. Please try again or contact support.",
        );
      }

      // Shown whether or not the email is actually registered — never confirm
      // or deny account existence from this screen.
      setSubmittedEmail(values.email);
    } catch (err) {
      setBannerError(
        err instanceof Error
          ? err.message
          : "Unable to send reset link. Please try again or contact support.",
      );
    }
  }

  if (submittedEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cloud-sky">
          <CheckCircle2 className="h-7 w-7 text-bright-blue" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-primary-navy">
          Check your email
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-gray">
          If an account exists for that email, we&apos;ve sent password reset
          instructions. Please check your inbox and spam folder.
        </p>

        <Link href="/login" className="mt-8 block">
          <Button type="button">Back to Login</Button>
        </Link>

        <p className="mt-6 text-xs leading-relaxed text-slate-gray">
          Didn&apos;t receive the email? Check your spam folder or try again
          in 5 minutes.
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <a
            href="mailto:support@edugear.ng"
            className="font-semibold text-bright-blue hover:underline"
          >
            Contact Support
          </a>
          <span aria-hidden className="text-slate-gray/40">
            &middot;
          </span>
          <a
            href="/security-policy"
            className="font-semibold text-bright-blue hover:underline"
          >
            Security Policy
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-gray hover:text-primary-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </Link>

      {bannerError && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600">
          <span>{bannerError}</span>
          <button
            type="button"
            onClick={() => setBannerError(null)}
            aria-label="Dismiss"
            className="shrink-0 text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <h2 className="mt-6 text-2xl font-bold text-primary-navy">
        Forgot your password?
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-gray">
        Enter the email address associated with your account and we&apos;ll
        send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Input
          label="School Email Address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="admin@school.edu.ng"
          error={errors.email?.message}
          {...register("email")}
        />

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-gray">
        Still having trouble? {" "}
        <a
          href="mailto:support@edugear.ng"
          className="font-semibold text-bright-blue hover:underline"
        >
          Contact your school administrator
        </a>
      </p>

      <div className="mt-8 flex items-center justify-center gap-4 border-t border-slate-gray/10 pt-6 text-xs text-slate-gray">
        <a href="/privacy" className="hover:text-primary-navy">
          Privacy Policy
        </a>
        <span aria-hidden>&middot;</span>
        <a href="/terms" className="hover:text-primary-navy">
          Terms of Service
        </a>
        <span aria-hidden>&middot;</span>
        <a href="/support" className="hover:text-primary-navy">
          Support Center
        </a>
      </div>
    </div>
  );
}