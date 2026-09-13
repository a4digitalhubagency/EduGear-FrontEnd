"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, CheckCircle2, ShieldAlert, X } from "lucide-react";
import { PasswordInput } from "../ui/Input";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../../lib/validation/auth";

interface ResetPasswordFormProps {
  /** The reset token from the emailed link's `?token=` query param. Null/missing means the link is invalid. */
  token: string | null;
}

type Stage = "form" | "expired" | "success";

const REQUIREMENTS: { label: string; test: (value: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
];

/**
 * Reset Password form — covers "Default State", "Link Expired State", and
 * "Success State" from the Stitch design system. "Interaction States" is an
 * internal reference card, not its own screen, so those behaviors are folded
 * in here: the live security-strength checklist, per-field validation
 * errors, and the loading label on submit.
 */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [stage, setStage] = useState<Stage>(token ? "form" : "expired");
  const [bannerError, setBannerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: ResetPasswordValues) {
    setBannerError(null);
    try {
      // TODO: wire up to the real EduGear auth endpoint (see docs/ARCHITECTURE.md §4.3).
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 410 || body?.code === "TOKEN_EXPIRED") {
          setStage("expired");
          return;
        }
        throw new Error(
          body?.message ?? "Unable to reset your password. Please try again.",
        );
      }

      setStage("success");
    } catch (err) {
      setBannerError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password. Please try again.",
      );
    }
  }

  if (stage === "expired") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="h-7 w-7 text-red-500" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-primary-navy">
          Link expired or invalid
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-gray">
          For your security, password reset links expire after 24 hours or
          can only be used once. Please request a new link to continue.
        </p>

        <Link href="/forgot-password" className="mt-8 block">
          <Button type="button">
            Request a new reset link
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-semibold text-bright-blue hover:underline"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  if (stage === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cloud-sky">
          <CheckCircle2 className="h-7 w-7 text-bright-blue" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-primary-navy">
          Password updated
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-gray">
          Your password has been successfully updated. You can now use your
          new password to log in to your dashboard.
        </p>

        <Link href="/login" className="mt-8 block">
          <Button type="button">
            Continue to Login
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <p className="mt-6 text-xs text-slate-gray">
          Need help? {" "}
          <a
            href="mailto:support@edugear.ng"
            className="font-semibold text-bright-blue hover:underline"
          >
            Contact school support
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary-navy">
        Create a new password
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-gray">
        Choose a strong password to secure your account access.
      </p>

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

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <PasswordInput
          label="New Password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordInput
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-gray">
            SECURITY STRENGTH
          </p>
          <ul className="mt-2 space-y-1.5">
            {REQUIREMENTS.map((req) => {
              const met = req.test(password ?? "");
              return (
                <li
                  key={req.label}
                  className={cn(
                    "flex items-center gap-2 text-xs font-medium",
                    met ? "text-bright-blue" : "text-slate-gray/60",
                  )}
                >
                  <Check
                    className={cn("h-3.5 w-3.5", met ? "opacity-100" : "opacity-40")}
                  />
                  {req.label}
                </li>
              );
            })}
          </ul>
        </div>

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? "Updating credentials..." : "Reset Password"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-gray">
        <Link href="/login" className="font-semibold text-bright-blue hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
}