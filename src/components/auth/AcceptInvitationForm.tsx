"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { PasswordInput } from "../ui/Input";
import { ApiError, api, jsonBody, passwordErrorMessage } from "../../lib/api-client";
import { cn } from "../../lib/utils";
import { PASSWORD_REQUIREMENTS, resetPasswordSchema, type ResetPasswordValues } from "../../lib/validation/auth";

type Stage = "form" | "invalid" | "success";

/**
 * Accept an invitation (POST /users/accept-invitation): staff invited from Personnel
 * and parents given a portal login both land here from their email, set a password,
 * and then sign in. Same card layout and password checklist as Reset Password; the
 * rules are the backend's (10+ characters, a letter and a number, not too common).
 */
export function AcceptInvitationForm({ token }: { token: string | null }) {
  const [stage, setStage] = useState<Stage>(token ? "form" : "invalid");
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: ResetPasswordValues) {
    setError(null);
    try {
      // Public: there's no session yet; the invitation token says who this is.
      await api("/users/accept-invitation", { ...jsonBody("POST", { token, password: values.password }), auth: false });
      setStage("success");
    } catch (err) {
      const used =
        err instanceof ApiError &&
        (err.errorCode === "TOKEN_INVALID" || err.errorCode === "TOKEN_EXPIRED" || /no longer valid/i.test(err.message));
      if (used) setStage("invalid");
      else setError(passwordErrorMessage(err));
    }
  }

  if (stage === "invalid") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-primary-navy">Invitation expired or invalid</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-gray">
          This invitation link has expired, has already been used, or was withdrawn. Ask your school administrator to send a new
          one. If you&apos;ve already set your password, just sign in.
        </p>
        <Link href="/login" className="mt-8 block">
          <Button type="button">
            Go to Sign In
            <ArrowRight className="h-4 w-4" />
          </Button>
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
        <h2 className="mt-6 text-2xl font-bold text-primary-navy">You&apos;re all set</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-gray">
          Your account is ready. Sign in with your email address and the password you just chose.
        </p>
        <Link href="/login" className="mt-8 block">
          <Button type="button">
            Continue to Sign In
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary-navy">Accept your invitation</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-gray">Choose a password to finish setting up your EduGear account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <PasswordInput label="Password" autoComplete="new-password" placeholder="••••••••••" error={errors.password?.message} {...register("password")} />
        <PasswordInput
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="••••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <ul className="space-y-1.5">
          {PASSWORD_REQUIREMENTS.map((req) => {
            const met = req.test(password ?? "");
            return (
              <li key={req.label} className={cn("flex items-center gap-2 text-xs font-medium", met ? "text-bright-blue" : "text-slate-gray/60")}>
                <Check className={cn("h-3.5 w-3.5", met ? "opacity-100" : "opacity-40")} />
                {req.label}
              </li>
            );
          })}
        </ul>
        <FormError message={error} />
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? "Setting up..." : "Set Password"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-gray">
        Already set up?{" "}
        <Link href="/login" className="font-semibold text-bright-blue hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
